/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {DestroyRef, EnvironmentInjector, EnvironmentProviders, inject, makeEnvironmentProviders, NgZone, PlatformRef, provideAppInitializer, runInInjectionContext} from '@angular/core';
import {ApplicationConfig, Handler, IntentInterceptor, IntentMessage, MessageClient, MessageHeaders, MessageInterceptor, MicrofrontendPlatformHost, ObservableDecorator, PlatformCapabilityTypes, TopicMessage} from '@scion/microfrontend-platform';
import {environment} from '../environments/environment';
import {TestingAppTopics} from './testing-app.topics';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgZoneObservableDecorator} from './ng-zone-observable-decorator';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

/**
 * Registers a set of DI providers to set up SCION Microfrontend Platform Host.
 *
 * The apps to be registered with the platform are read from the environment.
 *
 * Has no effect if not the host.
 */
export function provideMicrofrontendPlatformHost(): EnvironmentProviders | [] {
  if (window !== window.top) {
    return [];
  }

  return makeEnvironmentProviders([
    provideAppInitializer(() => runInInjectionContext(inject(EnvironmentInjector), startMicrofrontendPlatformHost)),
  ]);
}

/**
 * Starts the SCION Microfrontend Platform Host.
 */
async function startMicrofrontendPlatformHost(): Promise<void> {
  const zone = inject(NgZone);
  const platformRef = inject(PlatformRef);
  const queryParams = getCurrentQueryParams(inject(LocationStrategy));

  // Read the config from the query params
  const manifestClassifier = queryParams.has('manifestClassifier') ? `-${queryParams.get('manifestClassifier')}` : '';
  const activatorApiDisabled = coerceBooleanProperty(queryParams.get('activatorApiDisabled'));
  const intentionRegisterApiDisabled = new Set((queryParams.get('intentionRegisterApiDisabled') || '').split(','));
  const hasDevTools = !!environment.devtools && (!queryParams.has('devtools') || coerceBooleanProperty(queryParams.get('devtools')));

  installMessageInterceptors(queryParams);
  installIntentInterceptors(queryParams);

  // Read testing apps to be registered from the environment
  const testingAppConfigs: ApplicationConfig[] = Object.values(environment.apps).map(app => {
    return {
      manifestUrl: `${app.url}/${app.symbolicName}-manifest${manifestClassifier}.json`,
      activatorLoadTimeout: app.activatorLoadTimeout,
      symbolicName: app.symbolicName,
      intentionRegisterApiDisabled: intentionRegisterApiDisabled.has(app.symbolicName),
    };
  });

  // Register devtools app if enabled for this environment
  if (hasDevTools) {
    testingAppConfigs.push(environment.devtools!);
  }

  // Log the startup progress (startup-progress.e2e-spec.ts).
  MicrofrontendPlatformHost.startupProgress$
    .pipe(takeUntilDestroyed(platformRef.injector.get(DestroyRef)))
    .subscribe({
      next: progress => console.debug(`[PlatformInitializer::host:progress] ${progress}%`),
      complete: () => console.debug(`[PlatformInitializer::host:progress] startup completed`),
    });

  // Make Observables to emit in the correct zone.
  Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});

  // Start the microfrontend platform as host
  await zone.runOutsideAngular(() => MicrofrontendPlatformHost.start({
    host: {
      manifest: {
        name: 'Host',
        intentions: [
          ...(hasDevTools ? [{type: PlatformCapabilityTypes.Microfrontend, qualifier: {component: 'devtools', vendor: 'scion'}}] : []),
        ],
      },
    },
    applications: testingAppConfigs,
    activatorLoadTimeout: environment.activatorLoadTimeout,
    activatorApiDisabled: activatorApiDisabled,
    properties: Array.from(queryParams.keys()).reduce((dictionary, key) => ({...dictionary, [key]: queryParams.get(key)}), {}),
  }));

  // When starting the app with the manifest classifier `activator-readiness`, send a ping request to the activators to test their readiness. (activator-readiness.e2e-spec.ts).
  if (manifestClassifier === '-activator-readiness') {
    Beans.get(MessageClient).request$<string>(TestingAppTopics.ActivatorPing)
      .pipe(takeUntilDestroyed(platformRef.injector.get(DestroyRef)))
      .subscribe(reply => console.debug(`[PlatformInitializer::activator:onactivate] [app=${reply.headers.get(MessageHeaders.AppSymbolicName)}, pingReply=${reply.body}]`));
  }
}

function installMessageInterceptors(queryParams: Map<string, string>): void {
  if (queryParams.has('intercept-message:reject')) {
    const interceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === queryParams.get('intercept-message:reject')) {
          throw Error('Message rejected by interceptor');
        }
        return next.handle(message);
      }
    };
    Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
  }

  if (queryParams.has('intercept-message:reject-async')) {
    const interceptor1 = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        return next.handle(message);
      }
    };
    const interceptor2 = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === queryParams.get('intercept-message:reject-async')) {
          return Promise.reject('Message rejected (async) by interceptor');
        }
        return next.handle(message);
      }
    };
    Beans.register(MessageInterceptor, {useValue: interceptor1, multi: true});
    Beans.register(MessageInterceptor, {useValue: interceptor2, multi: true});
  }

  if (queryParams.has('intercept-message:swallow')) {
    const interceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === queryParams.get('intercept-message:swallow')) {
          return Promise.resolve();
        }
        return next.handle(message);
      }
    };
    Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
  }

  if (queryParams.has('intercept-message:uppercase')) {
    const interceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage<string>, next: Handler<TopicMessage<string>>): Promise<void> {
        if (message.topic === queryParams.get('intercept-message:uppercase')) {
          return next.handle({...message, body: message.body!.toUpperCase()});
        }
        else {
          return next.handle(message);
        }
      }
    };
    Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
  }
}

function installIntentInterceptors(queryParams: Map<string, string>): void {
  if (queryParams.has('intercept-intent:reject')) {
    const interceptor = new class implements IntentInterceptor {
      public intercept(message: IntentMessage, next: Handler<IntentMessage>): Promise<void> {
        if (message.intent.type === queryParams.get('intercept-intent:reject')) {
          throw Error('Intent rejected by interceptor');
        }
        return next.handle(message);
      }
    };
    Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
  }

  if (queryParams.has('intercept-intent:swallow')) {
    const interceptor = new class implements IntentInterceptor {
      public intercept(message: IntentMessage, next: Handler<IntentMessage>): Promise<void> {
        if (message.intent.type === queryParams.get('intercept-intent:swallow')) {
          return Promise.resolve();
        }
        return next.handle(message);
      }
    };
    Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
  }

  // Continues the interceptor chain with the message body put into uppercase.
  if (queryParams.has('intercept-intent:uppercase')) {
    const interceptor = new class implements IntentInterceptor {
      public intercept(message: IntentMessage<string>, next: Handler<IntentMessage<string>>): Promise<void> {
        if (message.intent.type === queryParams.get('intercept-intent:uppercase')) {
          return next.handle({...message, body: message.body!.toUpperCase()});
        }
        else {
          return next.handle(message);
        }
      }
    };
    Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
  }

  // Continues the interceptor chain with the message body replaced with the stringified capability.
  if (queryParams.has('intercept-intent:capability-present')) {
    const interceptor = new class implements IntentInterceptor {
      public intercept(message: IntentMessage<string>, next: Handler<IntentMessage<string>>): Promise<void> {
        if (message.intent.type === queryParams.get('intercept-intent:capability-present')) {
          return next.handle({...message, body: JSON.stringify(message.capability)});
        }
        else {
          return next.handle(message);
        }
      }
    };
    Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
  }
}

/**
 * Returns current query params.
 */
function getCurrentQueryParams(locationStrategy: LocationStrategy): Map<string, string> {
  if (locationStrategy instanceof HashLocationStrategy) {
    return getQueryParams(window.location.hash.substring(window.location.hash.indexOf('?')));
  }
  else {
    return getQueryParams(window.location.search);
  }
}

function getQueryParams(url: string): Map<string, string> {
  const searchParams = new URLSearchParams(url);
  const queryParams = new Map<string, string>();
  searchParams.forEach((value, key) => queryParams.set(key, value));
  return queryParams;
}

