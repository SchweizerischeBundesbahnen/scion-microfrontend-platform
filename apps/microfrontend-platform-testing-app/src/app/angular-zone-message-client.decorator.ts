/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { BeanDecorator, Beans, Intent, IntentMessage, MessageClient, MessageOptions, PublishOptions, TopicMessage } from '@scion/microfrontend-platform';
import { MonoTypeOperatorFunction, Observable, Observer, TeardownLogic } from 'rxjs';
import { NgZone } from '@angular/core';

/**
 * Proxies invocations to the {@link MessageClient}, making Observables to emit inside the Angular zone.
 *
 * Because Angular does not control the {@link Window} of the broker gateway, Angular does not notice when messages
 * are received from the gateway, causing the application not being detected for changes.
 *
 * Alternatively, the patch 'zone-patch-rxjs' can be installed to make sure RxJS subscriptions and operators run in the correct zone.
 * For more information, see https://github.com/angular/zone.js/blob/master/NON-STANDARD-APIS.md
 *
 * You can load the patch in the `app.module.ts` as following:
 * ```
 * import 'zone.js/dist/zone-patch-rxjs';
 * ```
 */
export class AngularZoneMessageClientDecorator implements BeanDecorator<MessageClient> {

  public decorate(messageClient: MessageClient): MessageClient {
    const zone = Beans.get(NgZone);
    return new class implements MessageClient { // tslint:disable-line:new-parens

      public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
        return messageClient.publish(topic, message, options); // Unlike Observables, Promises correctly synchronize with the Angular zone.
      }

      public request$<T>(topic: string, request?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
        return messageClient.request$<T>(topic, request, options).pipe(emitInsideAngular(zone));
      }

      public onMessage$<T>(topic: string): Observable<TopicMessage<T>> {
        return messageClient.onMessage$<T>(topic).pipe(emitInsideAngular(zone));
      }

      public issueIntent<T = any>(intent: Intent, body?: T, options?: MessageOptions): Promise<void> {
        return messageClient.issueIntent(intent, body, options); // Unlike Observables, Promises correctly synchronize with the Angular zone.
      }

      public requestByIntent$<T>(intent: Intent, body?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
        return messageClient.requestByIntent$<T>(intent, body, options).pipe(emitInsideAngular(zone));
      }

      public onIntent$<T>(selector?: Intent): Observable<IntentMessage<T>> {
        return messageClient.onIntent$<T>(selector).pipe(emitInsideAngular(zone));
      }

      public subscriberCount$(topic: string): Observable<number> {
        return messageClient.subscriberCount$(topic).pipe(emitInsideAngular(zone));
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

