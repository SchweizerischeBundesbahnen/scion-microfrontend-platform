/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
// tslint:disable:unified-signatures
import { MonoTypeOperatorFunction, NEVER, Observable, of, OperatorFunction, throwError } from 'rxjs';
import { Intent, IntentMessage, MessageHeaders, ResponseStatusCodes, TopicMessage } from '../../messaging.model';
import { first, map, mergeMap, takeUntil } from 'rxjs/operators';
import { AbstractType, Beans, Type } from '../../bean-manager';
import { Qualifier } from '../../platform.model';

/**
 * Message client for sending and receiving messages between applications across origins.
 *
 * This message client offers pub/sub messaging to microfrontends in two flavors: `Topic-Based Messaging` and `Intent-Based Messaging`.
 * Both models feature the request-response message exchange pattern, let you include message headers, and support message interception to implement
 * cross-cutting messaging concerns.
 *
 * #### Topic-based Messaging
 * Topic-based messaging allows publishing a message to a topic, which then is transported to consumers subscribed to the topic. Topics
 * are case-sensitive and consist of one or more segments, each separated by a forward slash. When publishing a message to a topic, the
 * topic must be exact, thus not contain wildcards. Messages published to a topic are transported to all consumers subscribed to the topic.
 * Consumers, on the other hand, can subscribe to multiple topics simultaneously by using wildcard segments in the topic.
 *
 * The platform supports publishing a message as a retained message. Retained messages help newly-subscribed clients to get the last message
 * published to a topic immediately upon subscription. The broker stores one retained message per topic. To delete a retained message, send a
 * retained message without a body to the topic. Deletion messages are not transported to subscribers.
 *
 * #### Intent-based Messaging
 * Intent-based messaging focuses on controlled collaboration between micro applications. It is inspired by the Android platform where an application
 * can start an Activity via an Intent (such as sending an email).
 *
 * This kind of communication is similar to the topic-based communication, thus implements also the publish-subscribe messaging pattern, but additionally
 * requires the sending application to declare an intention in its manifest. Unlike topic-based communication, the message (also called the intent) is
 * exclusively transported to micro applications that provide a fulfilling capability through their manifest.
 *
 * In intent-based communication, the destination are capabilities, formulated in an abstract way, consisting of a a type, and optionally a qualifier. The
 * type categorizes a capability in terms of its functional semantics (e.g., microfrontend if representing a microfrontend). A capability may also define
 * a qualifier to differentiate the different capabilities of the same type. The type is a string literal and the qualifier a dictionary of key-value pairs.
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
   * message as a retained message for the topic; thus, clients receive this message immediately upon subscription. The broker stores only one retained
   * message per topic. To delete a retained message, send a retained message without a body to the topic - deletion messages are not transported to
   * subscribers.
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
  public abstract request$<T>(topic: string, request?: any, options?: MessageOptions): Observable<TopicMessage<T>>;

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
   * Beans.get(MessageClient).onMessage$(topic).subscribe((message: TopicMessage) => {
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
   * Beans.get(MessageClient).onMessage$(topic).subscribe((request: TopicMessage) => {
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
  public abstract onMessage$<T>(topic: string): Observable<TopicMessage<T>>;

  /**
   * Issues an intent. The platform transports the intent to micro applications that provide a fulfilling capability that is visible
   * to the sending micro application. The intent must be exact, thus not contain wildcards. Optionally, you can pass transfer data
   * along with the intent, or set message headers. Transfer data and headers must be serializable with the Structured Clone Algorithm.
   *
   * To publish the intent, this micro application must declare an intention intention in its manifest; otherwise, the intent is rejected.
   * A micro application is implicitly qualified to interact with capabilities that it provides; thus, it must not declare an intention.
   *
   * @param  intent - Describes the intent. The qualifier, if any, must be exact, thus not contain wildcards.
   * @param  body - Specifies optional transfer data to be carried along with the intent.
   *         It can be any object which is serializable with the structured clone algorithm.
   * @param  options - Controls how to issue the intent and allows setting message headers.
   * @return A Promise that resolves when dispatched the intent, or that rejects if the intent could not be dispatched,
   *         e.g., if missing the intention declaration, or because no application is registered to handle the intent.
   */
  public abstract issueIntent<T = any>(intent: Intent, body?: T, options?: MessageOptions): Promise<void>;

  /**
   * Issues an intent and receives one or more replies. The platform transports the intent to micro applications that provide a
   * fulfilling capability that is visible to the sending micro application. The intent must be exact, thus not contain wildcards.
   * Optionally, you can pass transfer data along with the intent, or set message headers. Transfer data and headers must be serializable
   * with the Structured Clone Algorithm.
   *
   * To publish the intent, this micro application must declare an intention intention in its manifest; otherwise, the intent is rejected.
   * A micro application is implicitly qualified to interact with capabilities that it provides; thus, it must not declare an intention.
   *
   * @param  intent - Describes the intent. The qualifier, if any, must be exact, thus not contain wildcards.
   * @param  body - Specifies optional transfer data to be carried along with the intent.
   *         It can be any object which is serializable with the structured clone algorithm.
   * @param  options - Controls how to send the request and allows setting request headers.
   * @return An Observable that emits when receiving a reply. It never completes. It throws an error if the intent
   *         could not be dispatched or if no replier is currently available to handle the intent. If expecting a single reply,
   *         use the `take(1)` operator to unsubscribe upon the receipt of the first reply.
   */
  public abstract requestByIntent$<T>(intent: Intent, body?: any, options?: MessageOptions): Observable<TopicMessage<T>>;

  /**
   * Receives an intent when some micro application wants to use functionality of this micro application.
   *
   * Intents are typically handled in an activator. Refer to {@link Activator} for more information.
   *
   * The micro application receives only intents for which it provides a fulfilling capability through its manifest.
   * You can filter received intents by passing a selector. As with declaring capabilities, the selector supports the use
   * of wildcards.
   *
   * ```typescript
   * const selector: IntentSelector = {
   *   type: 'microfrontend',
   *   qualifier: {entity: 'product', id: '*'},
   * };
   *
   * Beans.get(MessageClient).onIntent$(selector).subscribe((message: IntentMessage) => {
   *   const microfrontendPath = message.capability.properties.path;
   *   // Instruct the router to display the microfrontend in an outlet.
   *   Beans.get(OutletRouter).navigate(microfrontendPath, {
   *     outlet: message.body,
   *     params: message.intent.qualifier,
   *   });
   * });
   * ```
   *
   * If the received intent has the {@link MessageHeaders.ReplyTo} header field set, the publisher expects the receiver to send one or more
   * replies to that {@link MessageHeaders.ReplyTo ReplyTo} topic. If streaming responses, you can use the {@link takeUntilUnsubscribe}
   * operator to stop replying when the requestor unsubscribes.
   *
   * ```typescript
   *  const selector: IntentSelector = {
   *    type: 'auth',
   *    qualifier: {entity: 'user-access-token'},
   *  };
   *
   *  Beans.get(MessageClient).onIntent$(selector).subscribe((request: IntentMessage) => {
   *    const replyTo = request.headers.get(MessageHeaders.ReplyTo);
   *    authService.userAccessToken$
   *      .pipe(takeUntilUnsubscribe(replyTo))
   *      .subscribe(token => {
   *        Beans.get(MessageClient).publish(replyTo, token);
   *      });
   *  });
   * ```
   *
   * @param  selector - Allows filtering intents. The qualifier allows using wildcards (such as `*` or `?`) to match multiple intents simultaneously.\
   *         <p>
   *         <ul>
   *           <li>**Asterisk wildcard character (`*`):**\
   *             <ul>
   *               <li>If used as qualifier property key, matches intents even if having additional properties. Use it like this: `{'*': '*'}`.</li>
   *               <li>If used as qualifier property value, requires intents to contain that property, but with any value allowed (except for `null` or `undefined` values).</li>
   *             </ul>
   *           </li>
   *           <li>**Optional wildcard character (`?`):**\
   *               Is allowed as qualifier property value only and matches intents regardless of having or not having that property.
   *           </li>
   *         </ul>
   *
   * @return An Observable that emits intents for which this application provides a satisfying capability. It never completes.
   */
  public abstract onIntent$<T>(selector?: IntentSelector): Observable<IntentMessage<T>>;

  /**
   * Allows observing the number of subscriptions on a topic.
   *
   * @param  topic - Specifies the topic to observe. The topic must be exact, thus not contain wildcards.
   * @return An Observable that, when subscribed, emits the current number of subscribers on it. It never completes and
   *         emits continuously when the number of subscribers changes.
   */
  public abstract subscriberCount$(topic: string): Observable<number>;

  /**
   * Returns whether this client is connected to the message broker.
   *
   * This client connects to the message broker automatically at platform startup. If not connected, this app may be running standalone.
   */
  public abstract isConnected(): Promise<boolean>;
}

/**
 * Emits the values emitted by the source Observable until all consumers unsubscribe from the given topic. Then, it completes.
 *
 * @category Messaging
 */
export function takeUntilUnsubscribe<T>(topic: string, /* @internal */ messageClientType?: Type<MessageClient> | AbstractType<MessageClient>): MonoTypeOperatorFunction<T> {
  return takeUntil(Beans.get(messageClientType || MessageClient).subscriberCount$(topic).pipe(first(count => count === 0)));
}

/**
 * Maps each message to its body.
 *
 * @category Messaging
 */
export function mapToBody<T>(): OperatorFunction<TopicMessage<T> | IntentMessage<T>, T> {
  return map(message => message.body);
}

/**
 * Returns an Observable that mirrors the source Observable, unless receiving a message with
 * a status code other than {@link ResponseStatusCodes.OK}. Then, the stream will end with an
 * error and source Observable will be unsubscribed.
 *
 * @category Messaging
 */
export function throwOnErrorStatus<BODY>(): MonoTypeOperatorFunction<TopicMessage<BODY>> {
  return mergeMap((message: TopicMessage<BODY>): Observable<TopicMessage<BODY>> => {
    const status = message.headers.get(MessageHeaders.Status) || ResponseStatusCodes.ERROR;
    if (status === ResponseStatusCodes.OK) {
      return of(message);
    }

    if (message.body) {
      return throwError(`[${status}] ${message.body}`);
    }

    switch (status) {
      case ResponseStatusCodes.BAD_REQUEST: {
        return throwError(`${status}: The receiver could not understand the request due to invalid syntax.`);
      }
      case ResponseStatusCodes.NOT_FOUND: {
        return throwError(`${status}: The receiver could not find the requested resource.`);
      }
      case ResponseStatusCodes.ERROR: {
        return throwError(`${status}: The receiver encountered an internal error.`);
      }
      default: {
        return throwError(`${status}: Request error.`);
      }
    }
  });
}

/**
 * Control how to publish the message.
 *
 * @category Messaging
 */
export interface PublishOptions extends MessageOptions {
  /**
   * Instructs the broker to store this message as a retained message for the topic. With the retained flag set to `true`,
   * a client receives this message immediately upon subscription. The broker stores only one retained message per topic.
   * To delete the retained message, send a retained message without a body to the topic.
   */
  retain?: boolean;
}

/**
 * Control how to publish a message.
 *
 * @category Messaging
 */
export interface MessageOptions {
  /**
   * Sets headers to pass additional information with a message.
   */
  headers?: Map<string, any>;
}

/**
 * Allows filtering intents.
 *
 * @ignore
 */
export interface IntentSelector {
  /**
   * If specified, filters intents of the given type.
   */
  type?: string;
  /**
   * If specified, filters intents matching the given qualifier. You can use the asterisk wildcard (`*`)
   * or optional wildcard character (`?`) to match multiple intents.
   */
  qualifier?: Qualifier;
}

/**
 * Message client that does nothing.
 *
 * Use this message client in tests to not connect to the platform host.
 *
 * @category Messaging
 */
export class NullMessageClient implements MessageClient {

  public constructor() {
    console.log('[NullMessageClient] Using \'NullMessageClient\' for messaging. Messages cannot be sent or received.');
  }

  public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
    return Promise.resolve();
  }

  public request$<T>(topic: string, request?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
    return NEVER;
  }

  public onMessage$<T>(topic: string): Observable<TopicMessage<T>> {
    return NEVER;
  }

  public issueIntent<T = any>(intent: Intent, body?: T, options?: MessageOptions): Promise<void> {
    return Promise.resolve();
  }

  public requestByIntent$<T>(intent: Intent, body?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
    return NEVER;
  }

  public onIntent$<T>(selector?: Intent): Observable<IntentMessage<T>> {
    return NEVER;
  }

  public subscriberCount$(topic: string): Observable<number> {
    return NEVER;
  }

  public isConnected(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
