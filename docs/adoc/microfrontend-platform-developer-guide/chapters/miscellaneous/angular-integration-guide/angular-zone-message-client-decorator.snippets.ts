import { Intent, IntentClient, IntentMessage, IntentOptions, MessageClient, MicrofrontendPlatform, PlatformState, PublishOptions, RequestOptions, TopicMessage } from '@scion/microfrontend-platform';
import { Injectable, NgZone } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, pipe } from 'rxjs';
import { HttpPlatformConfigLoader } from './start-platform-via-initializer.snippets';
import { BeanDecorator, Beans } from '@scion/toolkit/bean-manager';
import { observeInside, subscribeInside } from '@scion/toolkit/operators';

// tslint:disable:new-parens

// tag::message-client-decorator[]
/**
 * Synchronizes Observable emissions of the {@link MessageClient} with the Angular zone.
 */
@Injectable({providedIn: 'root'})
export class NgZoneMessageClientDecorator implements BeanDecorator<MessageClient> {

  constructor(private _zone: NgZone) { // <1>
  }

  public decorate(messageClient: MessageClient): MessageClient { // <2>
    const zone = this._zone;
    return new class implements MessageClient {

      public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
        return messageClient.publish(topic, message, options);
      }

      public request$<T>(topic: string, request?: any, options?: RequestOptions): Observable<TopicMessage<T>> {
        return messageClient.request$<T>(topic, request, options).pipe(synchronizeWithAngular(zone)); // <3>
      }

      public observe$<T>(topic: string): Observable<TopicMessage<T>> {
        return messageClient.observe$<T>(topic).pipe(synchronizeWithAngular(zone)); // <3>
      }

      public subscriberCount$(topic: string): Observable<number> {
        return messageClient.subscriberCount$(topic).pipe(synchronizeWithAngular(zone)); // <3>
      }
    };
  }
}

// end::message-client-decorator[]

// tag::intent-client-decorator[]
/**
 * Synchronizes Observable emissions of the {@link IntentClient} with the Angular zone.
 */
@Injectable({providedIn: 'root'})
export class NgZoneIntentClientDecorator implements BeanDecorator<IntentClient> {

  constructor(private _zone: NgZone) { // <1>
  }

  public decorate(intentClient: IntentClient): IntentClient { // <2>
    const zone = this._zone;
    return new class implements IntentClient {

      public publish<T = any>(intent: Intent, body?: T, options?: IntentOptions): Promise<void> {
        return intentClient.publish(intent, body, options);
      }

      public request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>> {
        return intentClient.request$<T>(intent, body, options).pipe(synchronizeWithAngular(zone)); // <3>
      }

      public observe$<T>(selector?: Intent): Observable<IntentMessage<T>> {
        return intentClient.observe$<T>(selector).pipe(synchronizeWithAngular(zone)); // <3>
      }
    };
  }
}

// end::intent-client-decorator[]

// tag::emit-inside-angular[]
function synchronizeWithAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return pipe(
    subscribeInside(continueFn => zone.runOutsideAngular(continueFn)),
    observeInside(continueFn => zone.run(continueFn)),
  );
}

// end::emit-inside-angular[]

// tag::register-decorator[]
@Injectable({providedIn: 'root'})
export class PlatformInitializer {

  constructor(private _zone: NgZone, private _messageClientDecorator: NgZoneMessageClientDecorator, private _intentClientDecorator: NgZoneIntentClientDecorator) {
  }

  public init(): Promise<void> {
    // Decorate the message client for use with Angular.
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      Beans.registerDecorator(MessageClient, {useValue: this._messageClientDecorator}); // <1>
      Beans.registerDecorator(IntentClient, {useValue: this._intentClientDecorator}); // <2>
    });

    // Start the platform.
    return this._zone.runOutsideAngular(() => MicrofrontendPlatform.startHost(HttpPlatformConfigLoader));
  }
}

// end::register-decorator[]
