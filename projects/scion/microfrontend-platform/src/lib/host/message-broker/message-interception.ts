/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {IntentMessage, TopicMessage} from '../../messaging.model';

/**
 * Allows intercepting messages before their publication.
 *
 * An interceptor can reject or modify messages. Multiple interceptors can be registered, forming a chain in which each interceptor
 * is called one by one in registration order.
 *
 * For each message, the platform invokes the intercept method of the first registered interceptor, passing the message and the next
 * handler as arguments. By calling the next handler in the intercept method, message dispatching is continued. If there is no more
 * interceptor in the chain, the message is transported to the receivers, if any. But, if throwing an error in the intercept method,
 * message dispatching is aborted, and the error transported back to the sender.
 *
 * #### Registering Interceptors
 * You register interceptors with the bean manager when the host application starts. Interceptors can be registered only in the host
 * application. They are invoked in registration order.
 *
 * ```ts
 * Beans.register(MessageInterceptor, {useClass: MessageLoggerInterceptor, multi: true});
 * ```
 *
 * #### Filtering Messages for Interception
 * The platform passes all messages to the interceptors, including platform messages vital for its operation.
 * You can use the TopicMatcher to filter messages, allowing you to test whether a topic matches a pattern. The pattern must be a topic,
 * not a regular expression; thus, it must consist of one or more segments, each separated by a forward slash. The pattern can contain
 * wildcard segments. Wildcard segments start with a colon (:), acting act as a placeholder for any segment value.
 *
 * ```ts
 * class ProductValidatorInterceptor implements MessageInterceptor {
 *
 *   private topicMatcher = new TopicMatcher('product/:id');
 *
 *   public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
 *     // Pass messages sent to other topics.
 *     if (!this.topicMatcher.match(message.topic).matches) {
 *       return next.handle(message);
 *     }
 *
 *     // Validate the payload of the message.
 *     if (isValid(message.body)) {
 *       return next.handle(message);
 *     }
 *
 *     throw Error('Message failed schema validation');
 *   }
 * }
 * ```
 *
 * @category Messaging
 */
export abstract class MessageInterceptor implements Interceptor<TopicMessage, Handler<TopicMessage>> {

  /**
   * Intercepts a message before being published to its topic.
   *
   * Decide if to continue publishing by passing the message to the next handler, or to reject publishing by throwing an error,
   * or to swallow the message by not calling the next handler at all. If rejecting publishing, the error is transported to the
   * message publisher.
   *
   * Important: When passing the message to the next handler, either return its Promise or await it.
   * Otherwise, errors of subsequent interceptors would not be reported to the sender.
   *
   * @param  message - the message to be published to its topic
   * @param  next - the next handler in the chain; invoke its {@link Handler.handle} method to continue publishing.
   * @throws throw an error to reject publishing; the error is transported to the message publisher.
   */
  public abstract intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void>;
}

/**
 * Allows intercepting intents before their publication.
 *
 * An interceptor can reject or modify intents. Multiple interceptors can be registered, forming a chain in which each interceptor
 * is called one by one in registration order.
 *
 * For each intent, the platform invokes the intercept method of the first registered interceptor, passing the intent and the next
 * handler as arguments. By calling the next handler in the intercept method, intent dispatching is continued. If there is no more
 * interceptor in the chain, the intent is transported to the receivers, if any. But, if throwing an error in the intercept method,
 * intent dispatching is aborted, and the error transported back to the sender.
 *
 * #### Registering Interceptors
 * You register interceptors with the bean manager when the host application starts. Interceptors can be registered only in the host
 * application. They are invoked in registration order.
 *
 * ```ts
 * Beans.register(IntentInterceptor, {useClass: IntentLoggerInterceptor, multi: true});
 * ```
 *
 * #### Filtering intents for Interception
 * The platform passes all intents to the interceptors. The interceptor must filter intents of interest.
 *
 * @category Messaging
 * @category Intention API
 */
export abstract class IntentInterceptor implements Interceptor<IntentMessage, Handler<IntentMessage>> {

  /**
   * Intercepts an intent before being published.
   *
   * Decide if to continue publishing by passing the intent to the next handler, or to reject publishing by throwing an error,
   * or to swallow the intent by not calling the next handler at all. If rejecting publishing, the error is transported to
   * the intent issuer.
   *
   * Important: When passing the message to the next handler, either return its Promise or await it.
   * Otherwise, errors of subsequent interceptors would not be reported to the sender.
   *
   * @param  intent - the intent to be published
   * @param  next - the next handler in the chain; invoke its {@link Handler.handle} method to continue publishing.
   * @throws throw an error to reject publishing; the error is transported to the intent issuer.
   */
  public abstract intercept(intent: IntentMessage, next: Handler<IntentMessage>): Promise<void>;
}

/**
 * Chain to intercept messages before they are published. The chain is implemented according to the 'Chain of Responsibility' design pattern.
 *
 * A message travels along the chain of interceptors. If all interceptors let the message pass, it is published.
 *
 * @internal
 */
export interface PublishInterceptorChain<T> {

  /**
   * Passes a message along the chain of interceptors, if any, and publishes it.
   *
   * Each interceptor in the chain can reject publishing by throwing an error, ignore the message by not calling the next handler,
   * or continue the chain by calling the next handler.
   *
   * @throws throws an error if an interceptor rejected publishing.
   */
  interceptAndPublish(message: T): Promise<void>;
}

/**
 * Assembles the given interceptors to a chain of handlers which are called one after another. The publisher is added as terminal handler.
 *
 * @param interceptors - interceptors to be assembled to a chain
 * @param publisher - terminal handler to publish messages
 * @internal
 */
export function chainInterceptors<T>(interceptors: Interceptor<T, Handler<T>>[], publisher: (message: T) => Promise<void>): PublishInterceptorChain<T> {
  const terminalHandler = new class extends Handler<T> {
    public handle(message: T): Promise<void> {
      return publisher(message);
    }
  };

  const handlerChain = interceptors.reduceRight((next, interceptor) => new class extends Handler<T> {
    public handle(element: T): Promise<void> {
      return interceptor.intercept(element, next);
    }
  }, terminalHandler);

  return new class implements PublishInterceptorChain<T> {
    public interceptAndPublish(element: T): Promise<void> {
      return handlerChain.handle(element);
    }
  };
}

/**
 * Allows the interception of messages or intents before their publication.
 *
 * @see {@link MessageInterceptor}
 * @see {@link IntentInterceptor}
 * @category Messaging
 */
export interface Interceptor<T, H extends Handler<T>> {

  intercept(message: T, next: H): Promise<void>;
}

/**
 * Represents a handler in the chain of interceptors.
 *
 * @category Messaging
 */
export abstract class Handler<T> {
  /**
   * Invoke to continue the chain with the given message.
   */
  public abstract handle(message: T): Promise<void>;
}
