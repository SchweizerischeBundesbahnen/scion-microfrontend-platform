/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {Injectable, NgZone, OnDestroy} from '@angular/core';
import {ApplicationConfig, Handler, IntentClient, IntentInterceptor, IntentMessage, MessageClient, MessageHeaders, MessageInterceptor, MicrofrontendPlatform, PlatformState, TopicMessage} from '@scion/microfrontend-platform';
import {environment} from '../environments/environment';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {TestingAppTopics} from './testing-app.topics';
import {takeUntil} from 'rxjs/operators';
import {noop, Subject} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgZoneIntentClientDecorator, NgZoneMessageClientDecorator} from './ng-zone-decorators';

/**
 * Initializes the SCION Microfrontend Platform.
 *
 * The apps to be registered with the platform are read from the environment.
 */
@Injectable({providedIn: 'root'})
export class PlatformInitializer implements OnDestroy {

  private readonly _queryParams: Map<string, string>;
  private readonly _destroy$ = new Subject<void>();

  constructor(private _zone: NgZone, locationStrategy: LocationStrategy, private _messageClientDecorator: NgZoneMessageClientDecorator,
              private _intentClientDecorator: NgZoneIntentClientDecorator) {
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
    // Make the platform to run with Angular
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      Beans.registerDecorator(MessageClient, {useValue: this._messageClientDecorator});
      Beans.registerDecorator(IntentClient, {useValue: this._intentClientDecorator});
    });

    // Read the config from the query params
    const manifestClassifier = this._queryParams.has('manifestClassifier') ? `-${this._queryParams.get('manifestClassifier')}` : '';
    const activatorApiDisabled = coerceBooleanProperty(this._queryParams.get('activatorApiDisabled'));
    const intentionRegisterApiDisabled = new Set((this._queryParams.get('intentionRegisterApiDisabled') || '').split(','));

    this.installMessageInterceptors();
    this.installIntentInterceptors();

    // Read the apps from the environment
    const apps: ApplicationConfig[] = Object.values(environment.apps).map(app => {
      return {
        manifestUrl: `${app.url}/assets/${app.symbolicName}-manifest${manifestClassifier}.json`,
        activatorLoadTimeout: app.activatorLoadTimeout,
        symbolicName: app.symbolicName,
        intentionRegisterApiDisabled: intentionRegisterApiDisabled.has(app.symbolicName),
      };
    });

    // Load the devtools
    if (environment.devtools) {
      apps.push(environment.devtools);
    }

    // Log the startup progress (startup-progress.e2e-spec.ts).
    MicrofrontendPlatform.startupProgress$
      .pipe(takeUntil(this._destroy$))
      .subscribe(
        progress => {
          console.debug(`[PlatformInitializer::host:progress] ${progress}%`);
        },
        noop,
        () => {
          console.debug(`[PlatformInitializer::host:progress] startup completed`);
        });

    // Run the microfrontend platform as host app
    await this._zone.runOutsideAngular(() => {
        return MicrofrontendPlatform.startHost({
          apps: apps,
          activatorLoadTimeout: environment.activatorLoadTimeout,
          properties: Array.from(this._queryParams.keys()).reduce((dictionary, key) => ({...dictionary, [key]: this._queryParams.get(key)}), {}),
          platformFlags: {activatorApiDisabled: activatorApiDisabled},
        }, {symbolicName: determineAppSymbolicName()});
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
    // Make the platform to run with Angular
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      Beans.registerDecorator(MessageClient, {useValue: this._messageClientDecorator});
      Beans.registerDecorator(IntentClient, {useValue: this._intentClientDecorator});
    });

    // Run the microfrontend platform as client app
    return this._zone.runOutsideAngular(() => MicrofrontendPlatform.connectToHost({symbolicName: determineAppSymbolicName()}));
  }

  private installMessageInterceptors(): void {
    const queryParams = this._queryParams;

    if (queryParams.has('intercept-message:reject')) {
      const interceptor = new class implements MessageInterceptor {
        public intercept(message: TopicMessage, next: Handler<TopicMessage>): void {
          if (message.topic === queryParams.get('intercept-message:reject')) {
            throw Error('Message rejected by interceptor');
          }
          next.handle(message);
        }
      };
      Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
    }

    if (queryParams.has('intercept-message:swallow')) {
      const interceptor = new class implements MessageInterceptor {
        public intercept(message: TopicMessage, next: Handler<TopicMessage>): void {
          if (message.topic === queryParams.get('intercept-message:swallow')) {
            return;
          }
          next.handle(message);
        }
      };
      Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
    }

    if (queryParams.has('intercept-message:uppercase')) {
      const interceptor = new class implements MessageInterceptor {
        public intercept(message: TopicMessage<string>, next: Handler<TopicMessage<string>>): void {
          if (message.topic === queryParams.get('intercept-message:uppercase')) {
            next.handle({...message, body: message.body.toUpperCase()});
          }
          else {
            next.handle(message);
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
        public intercept(message: IntentMessage, next: Handler<IntentMessage>): void {
          if (message.intent.type === queryParams.get('intercept-intent:reject')) {
            throw Error('Intent rejected by interceptor');
          }
          next.handle(message);
        }
      };
      Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
    }
    if (queryParams.has('intercept-intent:swallow')) {
      const interceptor = new class implements IntentInterceptor {
        public intercept(message: IntentMessage, next: Handler<IntentMessage>): void {
          if (message.intent.type === queryParams.get('intercept-intent:swallow')) {
            return;
          }
          next.handle(message);
        }
      };
      Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
    }
    // Continues the interceptor chain with the message body put into uppercase.
    if (queryParams.has('intercept-intent:uppercase')) {
      const interceptor = new class implements IntentInterceptor {
        public intercept(message: IntentMessage<string>, next: Handler<IntentMessage<string>>): void {
          if (message.intent.type === queryParams.get('intercept-intent:uppercase')) {
            next.handle({...message, body: message.body.toUpperCase()});
          }
          else {
            next.handle(message);
          }
        }
      };
      Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
    }
    // Continues the interceptor chain with the message body replaced with the stringified capability.
    if (queryParams.has('intercept-intent:capability-present')) {
      const interceptor = new class implements IntentInterceptor {
        public intercept(message: IntentMessage<string>, next: Handler<IntentMessage<string>>): void {
          if (message.intent.type === queryParams.get('intercept-intent:capability-present')) {
            next.handle({...message, body: JSON.stringify(message.capability)});
          }
          else {
            next.handle(message);
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
function determineAppSymbolicName(): string {
  const application = Object.values(environment.apps).find(app => new URL(app.url).host === window.location.host);
  if (!application) {
    throw Error(`[AppError] Application served on wrong URL. Supported URLs are: ${Object.values(environment.apps).map(app => app.url)}`);
  }
  return application.symbolicName;
}
