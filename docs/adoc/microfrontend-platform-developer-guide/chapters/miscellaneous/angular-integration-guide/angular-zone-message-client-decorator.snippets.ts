import { BeanDecorator, Beans, Intent, IntentMessage, MessageClient, MessageOptions, MicrofrontendPlatform, PlatformState, PlatformStates, PublishOptions, TopicMessage } from '@scion/microfrontend-platform';
import { Injectable, NgZone } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, Observer, TeardownLogic } from 'rxjs';
import { HttpPlatformConfigLoader } from './start-platform-via-initializer.snippets';

// tag::decorator[]
/**
 * Decorates {@link MessageClient} for use with Angular, i.e. pipe its Observables to emit inside the Angular zone.
 */
export class AngularZoneMessageClientDecorator implements BeanDecorator<MessageClient> {

  public decorate(messageClient: MessageClient): MessageClient {
    const zone = Beans.get(NgZone); // <1>
    return new class implements MessageClient { // <2>

      public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
        return messageClient.publish(topic, message, options);
      }

      public request$<T>(topic: string, request?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
        return messageClient.request$<T>(topic, request, options).pipe(emitInsideAngular(zone)); // <3>
      }

      public onMessage$<T>(topic: string): Observable<TopicMessage<T>> {
        return messageClient.onMessage$<T>(topic).pipe(emitInsideAngular(zone)); // <3>
      }

      public issueIntent<T = any>(intent: Intent, body?: T, options?: MessageOptions): Promise<void> {
        return messageClient.issueIntent(intent, body, options);
      }

      public requestByIntent$<T>(intent: Intent, body?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
        return messageClient.requestByIntent$<T>(intent, body, options).pipe(emitInsideAngular(zone)); // <3>
      }

      public onIntent$<T>(selector?: Intent): Observable<IntentMessage<T>> {
        return messageClient.onIntent$<T>(selector).pipe(emitInsideAngular(zone)); // <3>
      }

      public subscriberCount$(topic: string): Observable<number> {
        return messageClient.subscriberCount$(topic).pipe(emitInsideAngular(zone)); // <3>
      }

      public isConnected(): Promise<boolean> {
        return zone.run(() => messageClient.isConnected());
      }
    };
  }
}

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

// end::decorator[]

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
    });

    // Start the platform.
    return MicrofrontendPlatform.startHost(HttpPlatformConfigLoader);
  }
}

// end::register-decorator[]
