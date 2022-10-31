/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {defer, noop, Observable, Subject, Subscription} from 'rxjs';
import {IntentMessage, mapToBody, throwOnErrorStatus, TopicMessage} from '../../messaging.model';
import {BrokerGateway} from './broker-gateway';
import {MessagingChannel, PlatformTopics} from '../../ɵmessaging.model';
import {Topics} from '../../topics.util';
import {MessageClient, PublishOptions, RequestOptions} from './message-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageHandler} from './message-handler';
import {takeUntil} from 'rxjs/operators';

export class ɵMessageClient implements MessageClient {

  private readonly _brokerGateway = Beans.get(BrokerGateway);

  public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
    assertTopic(topic, {allowWildcardSegments: false});
    const topicMessage: TopicMessage = {
      topic,
      retain: options?.retain ?? false,
      headers: new Map(options?.headers || []),
    };
    setBodyIfDefined(topicMessage, message);
    return this._brokerGateway.postMessage(MessagingChannel.Topic, topicMessage);
  }

  public request$<T>(topic: string, request?: any, options?: RequestOptions): Observable<TopicMessage<T>> {
    assertTopic(topic, {allowWildcardSegments: false});
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options?.headers || []);
    return defer(() => {
      const topicMessage: TopicMessage = {topic, retain: false, headers: new Map(headers) /* make a copy for each subscription to support multiple subscriptions */};
      setBodyIfDefined(topicMessage, request);
      return this._brokerGateway.requestReply$(MessagingChannel.Topic, topicMessage).pipe(throwOnErrorStatus());
    });
  }

  public observe$<T>(topic: string): Observable<TopicMessage<T>> {
    assertTopic(topic, {allowWildcardSegments: true});
    return this._brokerGateway.subscribeToTopic$<T>(topic);
  }

  public onMessage<IN = any, OUT = any>(topic: string, callback: (message: TopicMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
    return new MessageHandler(Beans.get(MessageClient).observe$<IN>(topic), callback).subscription;
  }

  public subscriberCount$(topic: string): Observable<number> {
    assertTopic(topic, {allowWildcardSegments: false});
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

function assertTopic(topic: string, options: {allowWildcardSegments: boolean}): void {
  if (topic === undefined || topic === null || topic.length === 0) {
    throw Error('[IllegalTopicError] Topic must not be `null`, `undefined` or empty');
  }

  if (!options.allowWildcardSegments && Topics.containsWildcardSegments(topic)) {
    throw Error(`[IllegalTopicError] Topic not allowed to contain wildcard segments. [topic='${topic}']`);
  }
}

function setBodyIfDefined<T>(message: TopicMessage<T> | IntentMessage<T>, body?: T): void {
  if (body !== undefined) {
    message.body = body;
  }
}
