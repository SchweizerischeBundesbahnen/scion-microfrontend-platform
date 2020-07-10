/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AngularZoneMessageClientDecorator } from './angular-zone-message-client.decorator';
import { ApplicationConfig, Beans, Handler, IntentInterceptor, IntentMessage, MessageClient, MessageHeaders, MessageInterceptor, MicrofrontendPlatform, PlatformMessageClient, PlatformState, PlatformStates, TopicMessage } from '@scion/microfrontend-platform';
import { environment } from '../environments/environment';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ConsoleService } from './console/console.service';
import { TestingAppTopics } from './testing-app.topics';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * Initializes the SCION Microfrontend Platform.
 *
 * The apps to be registered with the platform are read from the environment.
 */
@Injectable({providedIn: 'root'})
export class PlatformInitializer implements OnDestroy {

  private readonly _queryParams: Map<string, string>;
  private readonly _destroy$ = new Subject<void>();

  constructor(private _zone: NgZone, locationStrategy: LocationStrategy, private _consoleService: ConsoleService) {
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
    Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
      Beans.register(NgZone, {useValue: this._zone});
      Beans.registerDecorator(MessageClient, {useClass: AngularZoneMessageClientDecorator});
      Beans.registerDecorator(PlatformMessageClient, {useClass: AngularZoneMessageClientDecorator});
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
        symbolicName: app.symbolicName,
        intentionRegisterApiDisabled: intentionRegisterApiDisabled.has(app.symbolicName),
      };
    });

    // Run the microfrontend platform as host app

    await MicrofrontendPlatform.startHost({
      apps: apps,
      properties: Array.from(this._queryParams.keys()).reduce((dictionary, key) => ({...dictionary, [key]: this._queryParams.get(key)}), {}),
      platformFlags: {activatorApiDisabled: activatorApiDisabled},
    }, {symbolicName: determineAppSymbolicName()});

    // When starting the app with activators, send a ping request to the activators to test their readiness. (activator.e2e-spec.ts).
    if (manifestClassifier === '-activator') {
      Beans.get(MessageClient).request$<string>(TestingAppTopics.ActivatorPing)
        .pipe(takeUntil(this._destroy$))
        .subscribe(reply => {
          this._consoleService.log('onActivate', `${reply.headers.get(MessageHeaders.AppSymbolicName)} - ${reply.body}`);
        });
    }
  }

  private startClientPlatform(): Promise<void> {
    // Make the platform to run with Angular
    Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
      Beans.register(NgZone, {useValue: this._zone});
      Beans.registerDecorator(MessageClient, {useClass: AngularZoneMessageClientDecorator});
    });

    // Run the microfrontend platform as client app
    return MicrofrontendPlatform.connectToHost({symbolicName: determineAppSymbolicName()});
  }

  private installMessageInterceptors(): void {
    const queryParams = this._queryParams;

    if (queryParams.has('intercept-message:reject')) {
      const interceptor = new class implements MessageInterceptor { // tslint:disable-line:new-parens
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
      const interceptor = new class implements MessageInterceptor { // tslint:disable-line:new-parens
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
      const interceptor = new class implements MessageInterceptor { // tslint:disable-line:new-parens
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
      const interceptor = new class implements IntentInterceptor { // tslint:disable-line:new-parens
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
      const interceptor = new class implements IntentInterceptor { // tslint:disable-line:new-parens
        public intercept(message: IntentMessage, next: Handler<IntentMessage>): void {
          if (message.intent.type === queryParams.get('intercept-intent:swallow')) {
            return;
          }
          next.handle(message);
        }
      };
      Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
    }
    if (queryParams.has('intercept-intent:uppercase')) {
      const interceptor = new class implements IntentInterceptor { // tslint:disable-line:new-parens
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
