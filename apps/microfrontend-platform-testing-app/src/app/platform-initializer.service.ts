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
import {Injectable, NgZone, OnDestroy} from '@angular/core';
import {ApplicationConfig, Handler, IntentInterceptor, IntentMessage, MessageClient, MessageHeaders, MessageInterceptor, MicrofrontendPlatformClient, MicrofrontendPlatformHost, ObservableDecorator, TopicMessage} from '@scion/microfrontend-platform';
import {environment} from '../environments/environment';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {TestingAppTopics} from './testing-app.topics';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgZoneObservableDecorator} from './ng-zone-observable-decorator';

/**
 * Initializes the SCION Microfrontend Platform.
 *
 * The apps to be registered with the platform are read from the environment.
 */
@Injectable({providedIn: 'root'})
export class PlatformInitializer implements OnDestroy {

  private readonly _queryParams: Map<string, string>;
  private readonly _destroy$ = new Subject<void>();

  constructor(private _zone: NgZone, locationStrategy: LocationStrategy) {
    this._queryParams = this.getQueryParams(locationStrategy);
  }

  public init(): Promise<void> {
    if (window === window.top) {
      return this.startHostPlatform();
    }
    else {
      return this.startClientPlatform();
    }
  }

  private async startHostPlatform(): Promise<void> {
    // Read the config from the query params
    const manifestClassifier = this._queryParams.has('manifestClassifier') ? `-${this._queryParams.get('manifestClassifier')}` : '';
    const activatorApiDisabled = coerceBooleanProperty(this._queryParams.get('activatorApiDisabled'));
    const intentionRegisterApiDisabled = new Set((this._queryParams.get('intentionRegisterApiDisabled') || '').split(','));

    this.installMessageInterceptors();
    this.installIntentInterceptors();

    // Read testing apps to be registered from the environment
    const testingAppConfigs: ApplicationConfig[] = Object.values(environment.apps).map(app => {
      return {
        manifestUrl: `${app.url}/assets/${app.symbolicName}-manifest${manifestClassifier}.json`,
        activatorLoadTimeout: app.activatorLoadTimeout,
        symbolicName: app.symbolicName,
        intentionRegisterApiDisabled: intentionRegisterApiDisabled.has(app.symbolicName),
      };
    });

    // Register devtools app if enabled for this environment
    if (environment.devtools) {
      testingAppConfigs.push(environment.devtools);
    }

    // Log the startup progress (startup-progress.e2e-spec.ts).
    MicrofrontendPlatformHost.startupProgress$
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: progress => {
          console.debug(`[PlatformInitializer::host:progress] ${progress}%`);
        },
        complete: () => {
          console.debug(`[PlatformInitializer::host:progress] startup completed`);
        },
      });

    // Make Observables to emit in the correct zone.
    Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(this._zone)});

    // Run the microfrontend platform as host app
    await this._zone.runOutsideAngular(() => {
        return MicrofrontendPlatformHost.start({
          applications: testingAppConfigs,
          activatorLoadTimeout: environment.activatorLoadTimeout,
          activatorApiDisabled: activatorApiDisabled,
          properties: Array.from(this._queryParams.keys()).reduce((dictionary, key) => ({...dictionary, [key]: this._queryParams.get(key)}), {}),
        });
      },
    );

    // When starting the app with the manifest classifier `activator-readiness`, send a ping request to the activators to test their readiness. (activator-readiness.e2e-spec.ts).
    if (manifestClassifier === '-activator-readiness') {
      Beans.get(MessageClient).request$<string>(TestingAppTopics.ActivatorPing)
        .pipe(takeUntil(this._destroy$))
        .subscribe(reply => {
          console.debug(`[PlatformInitializer::activator:onactivate] [app=${reply.headers.get(MessageHeaders.AppSymbolicName)}, pingReply=${reply.body}]`);
        });
    }
  }

  private startClientPlatform(): Promise<void> {
    // Make Observables to emit in the correct zone.
    Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(this._zone)});
    // Connect to the host.
    return this._zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect(getCurrentTestingAppSymbolicName()));
  }

  private installMessageInterceptors(): void {
    const queryParams = this._queryParams;

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
            return next.handle({...message, body: message.body.toUpperCase()});
          }
          else {
            return next.handle(message);
          }
        }
      };
      Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
    }
  }

  private installIntentInterceptors(): void {
    const queryParams = this._queryParams;
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
            return next.handle({...message, body: message.body.toUpperCase()});
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

  private getQueryParams(locationStrategy: LocationStrategy): Map<string, string> {
    const urlSearchParams: URLSearchParams = (() => {
      if (locationStrategy instanceof HashLocationStrategy) {
        return new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')));
      }
      else {
        return new URLSearchParams(window.location.search);
      }
    })();

    const queryParams = new Map<string, string>();
    urlSearchParams.forEach((value, key) => queryParams.set(key, value));
    return queryParams;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Identifies the currently running app based on the configured apps in the environment and the current URL.
 */
function getCurrentTestingAppSymbolicName(): string {
  const application = Object.values(environment.apps).find(app => new URL(app.url).host === window.location.host);
  if (!application) {
    throw Error(`[AppError] Application served on wrong URL. Supported URLs are: ${Object.values(environment.apps).map(app => app.url)}`);
  }
  return application.symbolicName;
}
