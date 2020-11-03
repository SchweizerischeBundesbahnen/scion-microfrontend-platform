/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { defer, Observable } from 'rxjs';
import { Intent, IntentMessage, TopicMessage } from '../../messaging.model';
import { Qualifier } from '../../platform.model';
import { BrokerGateway } from './broker-gateway';
import { MessagingChannel } from '../../ɵmessaging.model';
import { filterByChannel, pluckMessage } from '../../operators';
import { filter } from 'rxjs/operators';
import { matchesIntentQualifier } from '../../qualifier-tester';

/**
 * Intent client for sending and receiving intents between microfrontends across origins.
 *
 * Intent-based communication enables controlled collaboration between micro applications. It is inspired by the Android platform,
 * where an application can start an activity via an intent (such as sending an email).
 *
 * Like topic-based communication, intent-based communication implements the pub/sub (publish/subscribe) messaging pattern, but is,
 * in contrast, stricter when sending messages. Sending messages is also referred to as issuing intents. It requires the sending
 * application to declare an intention in its manifest. Intents can only be issued if there is at least one fulfilling capability
 * present in the system to handle the intent. The platform transports intents exclusively to micro applications that provide a
 * fulfilling capability via their manifest.
 *
 * The communication is built on top of the native `postMessage` mechanism. The host app acts as message broker.
 *
 * #### Intent Addressing
 * In intent-based communication, the destination are capabilities, formulated in an abstract way, consisting of a a type, and optionally
 * a qualifier. The type categorizes a capability in terms of its functional semantics. A capability may also define a qualifier to
 * differentiate the different capabilities of the same type. The type is a string literal and the qualifier a dictionary of key-value pairs.
 *
 * ### Request-Response Messaging
 * Sometimes it is useful to initiate a request-response communication to wait for a response. Unlike with fire-and-forget intents, a temporary
 * inbox is created for the intent issuer to receive replies.
 *
 * @see {@link IntentMessage}
 * @see {@link Intent}
 * @see {@link MessageHeaders}
 *
 * @category Messaging
 */
export abstract class IntentClient {

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
  public abstract publish<T = any>(intent: Intent, body?: T, options?: IntentOptions): Promise<void>;

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
  public abstract request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>>;

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
   * Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => {
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
   *  Beans.get(IntentClient).observe$(selector).subscribe((request: IntentMessage) => {
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
  public abstract observe$<T>(selector?: IntentSelector): Observable<IntentMessage<T>>;
}

/**
 * @ignore
 */
export class ɵIntentClient implements IntentClient { // tslint:disable-line:class-name

  constructor(private readonly _brokerGateway: BrokerGateway) {
  }

  public publish<T = any>(intent: Intent, body?: T, options?: IntentOptions): Promise<void> {
    assertIntentQualifier(intent.qualifier, {allowWildcards: false});
    const headers = new Map(options && options.headers);
    const intentMessage: IntentMessage = {intent, headers: new Map(headers)};
    setBodyIfDefined(intentMessage, body);
    return this._brokerGateway.postMessage(MessagingChannel.Intent, intentMessage);
  }

  public request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>> {
    assertIntentQualifier(intent.qualifier, {allowWildcards: false});
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options && options.headers);
    return defer(() => {
      const intentMessage: IntentMessage = {intent, headers: new Map(headers)};
      setBodyIfDefined(intentMessage, body);
      return this._brokerGateway.requestReply$(MessagingChannel.Intent, intentMessage);
    });
  }

  public observe$<T>(selector?: IntentSelector): Observable<IntentMessage<T>> {
    return this._brokerGateway.message$
      .pipe(
        filterByChannel<IntentMessage<T>>(MessagingChannel.Intent),
        pluckMessage(),
        filter(message => !selector || !selector.type || selector.type === message.intent.type),
        filter(message => !selector || !selector.qualifier || matchesIntentQualifier(selector.qualifier, message.intent.qualifier)),
      );
  }
}

/**
 * Control how to publish an intent.
 *
 * @category Messaging
 */
export interface IntentOptions {
  /**
   * Sets headers to pass additional information with an intent.
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

function assertIntentQualifier(qualifier: Qualifier, options: { allowWildcards: boolean }): void {
  if (!qualifier || Object.keys(qualifier).length === 0) {
    return;
  }

  if (!options.allowWildcards && Object.entries(qualifier).some(([key, value]) => key === '*' || value === '*' || value === '?')) {
    throw Error(`[IllegalQualifierError] Qualifier must not contain wildcards. [qualifier='${JSON.stringify(qualifier)}']`);
  }
}

function setBodyIfDefined<T>(message: TopicMessage<T> | IntentMessage<T>, body?: T): void {
  if (body !== undefined) {
    message.body = body;
  }
}
