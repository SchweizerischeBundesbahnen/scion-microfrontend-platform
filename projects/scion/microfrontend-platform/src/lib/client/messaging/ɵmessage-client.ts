/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {defer, noop, Observable, Subject, Subscription} from 'rxjs';
import {mapToBody, throwOnErrorStatus, TopicMessage} from '../../messaging.model';
import {BrokerGateway} from './broker-gateway';
import {MessagingChannel, PlatformTopics, TopicSubscribeCommand} from '../../ɵmessaging.model';
import {MessageClient} from './message-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageHandler} from './message-handler';
import {takeUntil} from 'rxjs/operators';
import {PublishOptions, RequestOptions} from './publish-options';

/**
 * @internal
 */
export class ɵMessageClient implements MessageClient {

  private readonly _brokerGateway = Beans.get(BrokerGateway);

  public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
    const topicMessage: TopicMessage = {
      topic,
      retain: options?.retain ?? false,
      headers: new Map(options?.headers),
      body: message,
    };
    return this._brokerGateway.postMessage(MessagingChannel.Topic, topicMessage);
  }

  public request$<T>(topic: string, request?: any, options?: RequestOptions): Observable<TopicMessage<T>> {
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options?.headers);
    return defer(() => {
      const topicMessage: TopicMessage = {
        topic,
        retain: options?.retain ?? false,
        headers: new Map(headers), /* make a copy for each subscription to support multiple subscriptions */
        body: request,
      };
      return this._brokerGateway.requestReply$(MessagingChannel.Topic, topicMessage).pipe(throwOnErrorStatus());
    });
  }

  public observe$<T>(topic: string): Observable<TopicMessage<T>> {
    return this._brokerGateway.subscribe$({
      messageChannel: MessagingChannel.Topic,
      subscribeChannel: MessagingChannel.TopicSubscribe,
      unsubscribeChannel: MessagingChannel.TopicUnsubscribe,
      newSubscribeCommand: (subscriberId: string): TopicSubscribeCommand => ({topic, subscriberId, headers: new Map()}),
    });
  }

  public onMessage<IN = any, OUT = any>(topic: string, callback: (message: TopicMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
    return new MessageHandler(Beans.get(MessageClient).observe$<IN>(topic), callback).subscription;
  }

  public subscriberCount$(topic: string): Observable<number> {
    return new Observable<number>(observer => {
      const unsubscribe$ = new Subject<void>();
      this.request$<number>(PlatformTopics.RequestSubscriberCount, topic)
        .pipe(
          mapToBody(),
          takeUntil(unsubscribe$),
        )
        .subscribe({
          next: reply => observer.next(reply),
          error: error => observer.error(error),
          complete: noop, // As per the API, the Observable never completes, even if receiving a TERMINAL signal.
        });
      return (): void => unsubscribe$.next();
    });
  }
}
