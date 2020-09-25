import { BeanDecorator, Beans, Intent, IntentClient, IntentMessage, IntentOptions, MessageClient, MicrofrontendPlatform, PlatformState, PlatformStates, PublishOptions, RequestOptions, TopicMessage } from '@scion/microfrontend-platform';
import { Injectable, NgZone } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, Observer, TeardownLogic } from 'rxjs';
import { HttpPlatformConfigLoader } from './start-platform-via-initializer.snippets';

// tag::message-client-decorator[]
/**
 * Synchronizes Observable emissions of the MessageClient with the Angular zone.
 */
export class AngularZoneMessageClientDecorator implements BeanDecorator<MessageClient> {

  public decorate(messageClient: MessageClient): MessageClient {
    const zone = Beans.get(NgZone); // <1>
    return new class implements MessageClient { // <2>

      public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
        return messageClient.publish(topic, message, options);
      }

      public request$<T>(topic: string, request?: any, options?: RequestOptions): Observable<TopicMessage<T>> {
        return messageClient.request$<T>(topic, request, options).pipe(emitInsideAngular(zone)); // <3>
      }

      public observe$<T>(topic: string): Observable<TopicMessage<T>> {
        return messageClient.observe$<T>(topic).pipe(emitInsideAngular(zone)); // <3>
      }

      public subscriberCount$(topic: string): Observable<number> {
        return messageClient.subscriberCount$(topic).pipe(emitInsideAngular(zone)); // <3>
      }
    };
  }
}

// end::message-client-decorator[]

// tag::intent-client-decorator[]
/**
 * Synchronizes Observable emissions of the IntentClient with the Angular zone.
 */
export class AngularZoneIntentClientDecorator implements BeanDecorator<IntentClient> {

  public decorate(intentClient: IntentClient): IntentClient {
    const zone = Beans.get(NgZone); // <1>
    return new class implements IntentClient { // <2>

      public publish<T = any>(intent: Intent, body?: T, options?: IntentOptions): Promise<void> {
        return intentClient.publish(intent, body, options);
      }

      public request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>> {
        return intentClient.request$<T>(intent, body, options).pipe(emitInsideAngular(zone)); // <3>
      }

      public observe$<T>(selector?: Intent): Observable<IntentMessage<T>> {
        return intentClient.observe$<T>(selector).pipe(emitInsideAngular(zone)); // <3>
      }
    };
  }
}

// end::intent-client-decorator[]

// tag::emit-inside-angular[]
/**
 * Returns an Observable that mirrors the source Observable, but continues the operator chain inside
 * the Angular zone. The subscription to the source Observable is done outside of the Angular zone.
 */
function emitInsideAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>): Observable<T> => {
    return new Observable((observer: Observer<T>): TeardownLogic => {
      // Subscribe to the source Observable outside of the Angular zone.
      return zone.runOutsideAngular(() => {
        const subscription = source$.subscribe(
          next => zone.run(() => observer.next(next)), // continue the chain inside the Angular zone
          error => zone.run(() => observer.error(error)), // emit an error inside the Angular zone
          () => zone.run(() => observer.complete()), // complete the stream inside the Angular zone
        );

        // Unsubscribe from the source Observable outside of the Angular zone.
        return (): void => zone.runOutsideAngular(() => subscription.unsubscribe());
      });
    });
  };
}

// end::emit-inside-angular[]

// tag::register-decorator[]
@Injectable({providedIn: 'root'})
export class PlatformInitializer {

  constructor(private ngZone: NgZone) {
  }

  public init(): Promise<void> {
    // Decorate the message client for use with Angular.
    Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
      Beans.register(NgZone, {useValue: this.ngZone}); // <1>
      Beans.registerDecorator(MessageClient, {useClass: AngularZoneMessageClientDecorator}); // <2>
      Beans.registerDecorator(IntentClient, {useClass: AngularZoneIntentClientDecorator}); // <3>
    });

    // Start the platform.
    return MicrofrontendPlatform.startHost(HttpPlatformConfigLoader);
  }
}

// end::register-decorator[]
