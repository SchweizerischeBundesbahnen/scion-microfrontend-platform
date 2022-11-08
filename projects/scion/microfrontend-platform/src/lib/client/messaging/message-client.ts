/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MonoTypeOperatorFunction, Observable, Subscription} from 'rxjs';
import {TopicMessage} from '../../messaging.model';
import {first, takeUntil} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';

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
 * You can mark a message as "retained" for helping newly subscribed clients to get the last message published to a topic immediately upon
 * subscription. The broker stores one retained message per topic, i.e., a later sent retained message will replace a previously sent retained
 * message. To delete a retained message, send a retained message without payload to the topic.
 *
 * ### Retained Request
 * Unlike retained messages, retained requests are not replaced by later retained requests/messages and remain in the broker until the requestor unsubscribes.
 *
 * ### Request-Response Messaging
 * Sometimes it is useful to initiate a request-response communication to wait for a response. Unlike with fire-and-forget messaging, a temporary
 * inbox is created for the sender to receive replies. If there is no consumer subscribed on the topic, the platform throws an error.
 *
 * @see {@link TopicMessage}
 * @see {@link takeUntilUnsubscribe}
 *
 * @category Messaging
 */
export abstract class MessageClient {

  /**
   * Publishes a message to the given topic. The message is transported to all consumers subscribed to the topic.
   *
   * A message can be marked as "retained" by setting the {@link PublishOptions.retain} flag to `true`. It instructs the broker to store this message and
   * deliver it to new subscribers, even if they subscribe after the message has been published. The broker stores one retained message per topic. To
   * delete a retained message, send a retained message without payload to the topic. Deletion messages are not transported to subscribers.
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
   * Sends a request to the given topic and receives one or more replies.
   *
   * A request can be marked as "retained" by setting the {@link RequestOptions.retain} flag to `true`. It instructs the broker to store this request and
   * deliver it to new subscribers, even if they subscribe after the request has been sent. Retained requests are not replaced by later retained requests/
   * messages and remain in the broker until the requestor unsubscribes.
   *
   * If not marking the request as "retained", at least one subscriber must be subscribed to the topic. Otherwise, the request is rejected.
   *
   * @param  topic - Specifies the topic to which the request should be sent.
   *         Topics are case-sensitive and consist of one or more segments, each separated by a forward slash.
   *         The topic is required and must be exact, thus not contain wildcards.
   * @param  request - Specifies optional transfer data to be carried along with the request.
   *         It can be any object which is serializable with the structured clone algorithm.
   * @param  options - Controls how to send the request and allows setting request headers.
   * @return An Observable that emits when receiving a reply. It never completes unless the replier sets the status code {@link ResponseStatusCodes.TERMINAL}
   *         in the {@link MessageHeaders.Status} message header. Then, the Observable completes immediately after emitted the reply.
   *         The Observable errors if the request could not be dispatched. It will also error if the replier sets a status code greater than or equal to 400, e.g., {@link ResponseStatusCodes.ERROR}.
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
   *       Beans.get(MessageClient).publish(replyTo, `${temperature}°C`);
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
   * Convenience API for handling messages.
   *
   * Unlike `observe$`, messages are passed to a callback function rather than emitted from an Observable. Response(s) can be returned directly
   * from the callback. It supports error propagation and request termination. Using this method over `observe$` significantly reduces the code
   * required to respond to requests.
   *
   * For each message received, the specified callback function is called. When used in request-response communication,
   * the callback function can return the response either directly or in the form of a Promise or Observable. Returning a Promise
   * allows the response to be computed asynchronously, and an Observable allows to return one or more responses, e.g., for
   * streaming data.
   * If the callback function returns no value (void), returns `undefined`, or returns a Promise that resolves to `undefined`, communication is terminated
   * immediately without a response. If the callback returns an Observable, all its emissions are transported to the requestor and communication is not
   * terminated until the Observable completes. Termination of communication always completes the requestor's Observable.
   * If the callback throws an error, or the returned Promise or Observable errors, the error is
   * transported to the requestor, erroring the requestor's Observable.
   *
   * @param  topic - Specifies the topic which to observe.
   *         For more information, see the API description of {@link observe$}.
   * @param  callback - Specifies the callback to be called for each message. When used in request-response communication,
   *         the callback function can return the response either directly or in the form of a Promise or Observable. If returning
   *         a response in fire-and-forget communication, it is ignored. Throwing an error in the callback does not unregister the callback.
   * @return Subscription to unregister the callback. Calling {@link rxjs!Subscription.unsubscribe Subscription.unsubscribe} will complete the Observable of all
   *         requestors, if any.
   */
  public abstract onMessage<IN = any, OUT = any>(topic: string, callback: (message: TopicMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription;

  /**
   * Allows observing the number of subscriptions on a topic. The Observable never completes.
   *
   * @param  topic - Specifies the topic to observe. The topic must be exact, thus not contain wildcards.
   * @return An Observable that, when subscribed, emits the current number of subscribers on it. It never completes and
   *         emits continuously when the number of subscribers changes.
   */
  public abstract subscriberCount$(topic: string): Observable<number>;
}

/**
 * Returns an Observable that mirrors the source Observable as long as there is at least one subscriber subscribed to the
 * given topic. When the subscription count on the given topic drops to zero, the returned Observable completes. If there
 * is no topic subscription present at the time when subscribing to the Observable, then it completes immediately.
 *
 * This operator is similar to the RxJS {@link rxjs!takeUntil takeUntil} operator, but accepts a topic instead of a notifier Observable.
 *
 * @category Messaging
 */
export function takeUntilUnsubscribe<T>(topic: string): MonoTypeOperatorFunction<T> {
  return takeUntil(Beans.get(MessageClient).subscriberCount$(topic).pipe(first(count => count === 0)));
}

/**
 * Control how to publish a message.
 *
 * @category Messaging
 */
export interface PublishOptions {
  /**
   * Sets headers to pass additional information with a message.
   */
  headers?: Map<string, any>;
  /**
   * Instructs the broker to store this message on the broker as a retained message.
   *
   * Unlike a regular message, a retained message remains in the broker and is delivered to new subscribers, even if
   * they subscribe after the message has been sent. The broker stores one retained message per topic, i.e., a later
   * sent retained message will replace a previously sent retained message. This, however, does not apply to retained
   * requests in request-response communication. Retained requests are NEVER replaced and remain in the broker until
   * the requestor unsubscribes.
   *
   * To delete the retained message, send a retained message without payload to the same destination.
   */
  retain?: boolean;
}

/**
 * Control how to publish a request in request-response communication.
 *
 * @category Messaging
 */
export interface RequestOptions extends PublishOptions { // eslint-disable-line @typescript-eslint/no-empty-interface
}
