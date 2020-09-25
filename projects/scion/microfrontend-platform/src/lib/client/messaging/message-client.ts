/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { defer, MonoTypeOperatorFunction, Observable } from 'rxjs';
import { IntentMessage, mapToBody, TopicMessage } from '../../messaging.model';
import { first, takeUntil } from 'rxjs/operators';
import { AbstractType, Beans, Type } from '../../bean-manager';
import { BrokerGateway } from './broker-gateway';
import { Defined } from '@scion/toolkit/util';
import { MessagingChannel, PlatformTopics } from '../../ɵmessaging.model';
import { TopicMatcher } from '../../topic-matcher.util';

/**
 * Message client for sending and receiving messages between microfrontends across origins.
 *
 * This client implements the topic-based pub/sub (publish/subscribe) messaging model, allowing for one message to be delivered to
 * multiple subscribers using topic addressing.
 *
 * The communication is built on top of the native `postMessage` mechanism. The host app acts as message broker.
 *
 * ### Topic Addressing
 * A publisher publishes a message to a topic, which then is transported to consumers subscribed to the topic. Topics are case-sensitive
 * and consist of one or more segments, each separated by a forward slash. When publishing a message to a topic, the topic must be exact,
 * thus not contain wildcards. Messages published to a topic are transported to all consumers subscribed to the topic. Consumers, on the
 * other hand, can subscribe to multiple topics simultaneously by using wildcard segments in the topic.
 *
 * ### Retained Message
 * You can publish a message as a retained message for helping newly-subscribed clients to get the last message published to a topic
 * immediately upon subscription. The broker stores one retained message per topic. To delete a retained message, send a retained message
 * without a body to the topic. Deletion messages are not transported to subscribers.
 *
 * ### Request-Response Messaging
 * Sometimes it is useful to initiate a request-response communication to wait for a response. Unlike with fire-and-forget messaging, a temporary
 * inbox is created for the sender to receive replies. If there is no consumer subscribed on the topic, the platform throws an error.
 *
 * @see {@link TopicMessage}
 * @see {@link IntentMessage}
 * @see {@link Intent}
 * @see {@link MessageHeaders}
 * @see {@link takeUntilUnsubscribe}
 *
 * @category Messaging
 */
export abstract class MessageClient {

  /**
   * Publishes a message to the given topic. The message is transported to all consumers subscribed to the topic.
   *
   * A message can be sent as a retained message by setting the {@link PublishOptions.retain} flag to `true`. It instructs the broker to store this
   * message as a retained message for the topic; thus, clients receive this message immediately upon subscription. The broker stores only the latest
   * retained message on a topic. To delete a retained message, send a retained message without a body to the topic - deletion messages are not
   * transported to subscribers.
   *
   * @param  topic - Specifies the topic to which the message should be sent.
   *         Topics are case-sensitive and consist of one or more segments, each separated by a forward slash.
   *         The topic is required and must be exact, thus not contain wildcards.
   * @param  message - Specifies optional transfer data to be carried along with this message.
   *         It can be any object which is serializable with the structured clone algorithm.
   * @param  options - Controls how to publish the message and allows setting message headers.
   * @return A Promise that resolves when dispatched the message, or that rejects if the message could not be dispatched.
   */
  public abstract publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void>;

  /**
   * Sends a request to the given topic and receives one or more replies. To publish a request, at least one subscriber must be subscribed to the topic.
   * Otherwise, the request is rejected.
   *
   * @param  topic - Specifies the topic to which the request should be sent.
   *         Topics are case-sensitive and consist of one or more segments, each separated by a forward slash.
   *         The topic is required and must be exact, thus not contain wildcards.
   * @param  request - Specifies optional transfer data to be carried along with the request.
   *         It can be any object which is serializable with the structured clone algorithm.
   * @param  options - Controls how to send the request and allows setting request headers.
   * @return An Observable that emits when receiving a reply. It never completes. It throws an error if the message
   *         could not be dispatched or if no replier is currently subscribed to the topic. If expecting a single reply,
   *         use the `take(1)` operator to unsubscribe upon the receipt of the first reply.
   */
  public abstract request$<T>(topic: string, request?: any, options?: RequestOptions): Observable<TopicMessage<T>>;

  /**
   * Receives messages published to the given topic.
   *
   * You can subscribe to multiple topics simultaneously by using wildcard segments in the topic. If a segment begins with a colon (`:`),
   * then the segment acts as a placeholder for any segment value. Substituted segment values are then available via the params property
   * of the received message.
   *
   * ```ts
   * const topic: string = 'myhome/:room/temperature';
   *
   * Beans.get(MessageClient).observe$(topic).subscribe((message: TopicMessage) => {
   *   console.log(message.params);
   * });
   * ```
   *
   * If the received message has the {@link MessageHeaders.ReplyTo} header field set, the publisher expects the receiver to send one or more
   * replies to that {@link MessageHeaders.ReplyTo ReplyTo} topic. If streaming responses, you can use the {@link takeUntilUnsubscribe}
   * operator to stop replying when the requestor unsubscribes.
   *
   * ```ts
   * const topic: string = 'myhome/livingroom/temperature';
   *
   * Beans.get(MessageClient).observe$(topic).subscribe((request: TopicMessage) => {
   *   const replyTo = request.headers.get(MessageHeaders.ReplyTo);
   *   sensor$
   *     .pipe(takeUntilUnsubscribe(replyTo))
   *     .subscribe(temperature => {
   *       Beans.get(MessageClient).publish(replyTo, `${temperature} °C`);
   *     });
   * });
   * ```
   *
   * @param  topic - Specifies the topic which to observe.
   *         Topics are case-sensitive and consist of one or more segments, each separated by a forward slash.
   *         You can subscribe to the exact topic of a published message, or use wildcards to subscribe to multiple
   *         topics simultaneously. If a segment begins with a colon (`:`), then the segment acts as a placeholder for any
   *         string value. Substituted segment values are available in the {@link TopicMessage.params} on the received message.
   * @return An Observable that emits messages sent to the given topic. It never completes.
   */
  public abstract observe$<T>(topic: string): Observable<TopicMessage<T>>;

  /**
   * Allows observing the number of subscriptions on a topic.
   *
   * @param  topic - Specifies the topic to observe. The topic must be exact, thus not contain wildcards.
   * @return An Observable that, when subscribed, emits the current number of subscribers on it. It never completes and
   *         emits continuously when the number of subscribers changes.
   */
  public abstract subscriberCount$(topic: string): Observable<number>;
}

/**
 * Returns an Observable that mirrors the source Observable as long as there is at least one subscriber subscribed to the
 * given topic. When the subscription count of the given topic drops to zero, the returned Observable completes. If there
 * is no topic subscription present at the time when subscribing to the Observable, then it completes immediately.
 *
 * This operator is similar to the RxJS {@link takeUntil} operator, but accepts a topic instead of a notifier Observable.
 *
 * @category Messaging
 */
export function takeUntilUnsubscribe<T>(topic: string, /* @internal */ messageClientType?: Type<MessageClient> | AbstractType<MessageClient>): MonoTypeOperatorFunction<T> {
  return takeUntil(Beans.get(messageClientType || MessageClient).subscriberCount$(topic).pipe(first(count => count === 0)));
}

/**
 * Control how to publish the message.
 *
 * @category Messaging
 */
export interface PublishOptions {
  /**
   * Sets headers to pass additional information with a message.
   */
  headers?: Map<string, any>;
  /**
   * Instructs the broker to store this message as a retained message for the topic. With the retained flag set to `true`,
   * a client receives this message immediately upon subscription. The broker stores only one retained message per topic.
   * To delete the retained message, send a retained message without a body to the topic.
   */
  retain?: boolean;
}

/**
 * Control how to publish a message in request-response communication.
 *
 * @category Messaging
 */
export interface RequestOptions {
  /**
   * Sets headers to pass additional information with a message.
   */
  headers?: Map<string, any>;
}

/**
 * @ignore
 */
export class ɵMessageClient implements MessageClient { // tslint:disable-line:class-name

  constructor(private readonly _brokerGateway: BrokerGateway) {
  }

  public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
    assertTopic(topic, {allowWildcardSegments: false});
    const headers = new Map(options && options.headers);
    const topicMessage: TopicMessage = {topic, retain: Defined.orElse(options && options.retain, false), headers: new Map(headers)};
    setBodyIfDefined(topicMessage, message);
    return this._brokerGateway.postMessage(MessagingChannel.Topic, topicMessage);
  }

  public request$<T>(topic: string, request?: any, options?: RequestOptions): Observable<TopicMessage<T>> {
    assertTopic(topic, {allowWildcardSegments: false});
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options && options.headers);
    return defer(() => {
      const topicMessage: TopicMessage = {topic, retain: false, headers: new Map(headers)};
      setBodyIfDefined(topicMessage, request);
      return this._brokerGateway.requestReply$(MessagingChannel.Topic, topicMessage);
    });
  }

  public observe$<T>(topic: string): Observable<TopicMessage<T>> {
    assertTopic(topic, {allowWildcardSegments: true});
    return this._brokerGateway.subscribeToTopic<T>(topic);
  }

  public subscriberCount$(topic: string): Observable<number> {
    assertTopic(topic, {allowWildcardSegments: false});
    return this.request$<number>(PlatformTopics.RequestSubscriberCount, topic).pipe(mapToBody());
  }
}

function assertTopic(topic: string, options: { allowWildcardSegments: boolean }): void {
  if (topic === undefined || topic === null || topic.length === 0) {
    throw Error('[IllegalTopicError] Topic must not be `null`, `undefined` or empty');
  }

  if (!options.allowWildcardSegments && TopicMatcher.containsWildcardSegments(topic)) {
    throw Error(`[IllegalTopicError] Topic not allowed to contain wildcard segments. [topic='${topic}']`);
  }
}

function setBodyIfDefined<T>(message: TopicMessage<T> | IntentMessage<T>, body?: T): void {
  if (body !== undefined) {
    message.body = body;
  }
}
