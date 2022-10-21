/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Observable, Subscription} from 'rxjs';
import {Intent, IntentMessage, TopicMessage} from '../../messaging.model';
import {Qualifier} from '../../platform.model';

/**
 * Allows sending and receiving intents between microfrontends across origins.
 * This client is part of the Intention API of the SCION Microfrontend Platform.
 *
 * Intent-based messaging enables controlled collaboration between micro applications, a mechanism known from Android development
 * where an application can start an activity via an intent (such as sending an email).
 *
 * Like topic-based communication, intent-based communication implements the pub/sub (publish/subscribe) messaging pattern, but is,
 * in contrast, more restrictive when sending messages. Sending messages is also referred to as issuing intents. It requires the sending
 * application to declare an intention in its manifest. Intents are received only by applications that provide a fulfilling capability.
 * If no application provides a fulfilling capability, the platform rejects the intent.
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
 * @category Intention API
 */
export abstract class IntentClient {

  /**
   * Sends an intent.
   *
   * A micro application can send intents for intentions declared in its manifest. The platform transports the intent to micro applications
   * that provide a fulfilling capability. Along with the intent, the application can pass transfer data, either as payload, message headers
   * or parameters. Passed data must be serializable with the Structured Clone Algorithm.
   *
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
   * Sends an intent and receives one or more replies.
   *
   * A micro application can send intents for intentions declared in its manifest. The platform transports the intent to micro applications
   * that provide a fulfilling capability. Along with the intent, the application can pass transfer data, either as payload, message headers
   * or parameters. Passed data must be serializable with the Structured Clone Algorithm.
   *
   * A micro application is implicitly qualified to interact with capabilities that it provides; thus, it must not declare an intention.
   *
   * @param  intent - Describes the intent. The qualifier, if any, must be exact, thus not contain wildcards.
   * @param  body - Specifies optional transfer data to be carried along with the intent.
   *         It can be any object which is serializable with the structured clone algorithm.
   * @param  options - Controls how to send the request and allows setting request headers.
   * @return An Observable that emits when receiving a reply. It never completes unless the intent handler sets the status code {@link ResponseStatusCodes.TERMINAL}
   *         in the {@link MessageHeaders.Status} message header. Then, the Observable completes immediately after emitted the reply.
   *         The Observable errors if the intent could not be dispatched or if no replier is currently available to handle the intent. It will also error if the
   *         intent handler sets a status code greater than or equal to 400, e.g., {@link ResponseStatusCodes.ERROR}.
   */
  public abstract request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>>;

  /**
   * Receives an intent when some micro application wants to collaborate with this micro application.
   *
   * Intents are typically subscribed to in an activator. Refer to {@link ActivatorCapability} for more information.
   *
   * The micro application receives only intents for which it provides a fulfilling capability.
   * You can filter received intents by passing a selector. The selector supports the use of wildcards.
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
   * @return An Observable that emits received intents. It never completes.
   */
  public abstract observe$<T>(selector?: IntentSelector): Observable<IntentMessage<T>>;

  /**
   * Convenience API for handling intents.
   *
   * Unlike `observe$`, intents are passed to a callback function rather than emitted from an Observable. Response(s) can be returned directly
   * from the callback. It supports error propagation and request termination. Using this method over `observe$` significantly reduces the code
   * required to respond to requests.
   *
   * For each intent received, the specified callback function is called. When used in request-response communication,
   * the callback function can return the response either directly or in the form of a Promise or Observable. Returning a Promise
   * allows the response to be computed asynchronously, and an Observable allows to return one or more responses, e.g., for
   * streaming data.
   * If the callback function returns no value (void), returns `undefined`, or returns a Promise that resolves to `undefined`, communication is terminated
   * immediately without a response. If the callback returns an Observable, all its emissions are transported to the requestor and communication is not
   * terminated until the Observable completes. Termination of communication always completes the requestor's Observable.
   * If the callback throws an error, or the returned Promise or Observable errors, the error is
   * transported to the requestor, erroring the requestor's Observable.
   *
   * @param  selector - Allows filtering intents.
   *         For more information, see the API description of {@link observe$}.
   * @param  callback - Specifies the callback to be called for each intent. When used in request-response communication,
   *         the callback function can return the response either directly or in the form of a Promise or Observable. If returning
   *         a response in fire-and-forget communication, it is ignored. Throwing an error in the callback does not unregister the callback.
   * @return Subscription to unregister the callback. Calling {@link rxjs!Subscription.unsubscribe Subscription.unsubscribe} will complete the Observable of all
   *         requestors, if any.
   */
  public abstract onIntent<IN = any, OUT = any>(selector: IntentSelector, callback: (intentMessage: IntentMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription;
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
