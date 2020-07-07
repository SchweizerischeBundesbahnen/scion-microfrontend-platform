/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { mapToBody, MessageClient, MessageOptions, PublishOptions } from './message-client';
import { defer, EMPTY, merge, Observable, Observer, Subject, TeardownLogic, throwError } from 'rxjs';
import { MessageDeliveryStatus, MessageEnvelope, MessagingChannel, MessagingTransport, PlatformTopics, TopicSubscribeCommand, TopicUnsubscribeCommand } from '../../ɵmessaging.model';
import { filterByChannel, filterByHeader, filterByTopic, pluckMessage } from '../../operators';
import { filter, finalize, first, map, mergeMap, takeUntil, timeoutWith } from 'rxjs/operators';
import { Defined, Dictionaries } from '@scion/toolkit/util';
import { UUID } from '@scion/toolkit/uuid';
import { Intent, IntentMessage, Message, MessageHeaders, TopicMessage } from '../../messaging.model';
import { matchesIntentQualifier } from '../../qualifier-tester';
import { BrokerGateway } from './broker-gateway';
import { Beans, PreDestroy } from '../../bean-manager';
import { TopicMatcher } from '../../topic-matcher.util';
import { Qualifier } from '../../platform.model';
import { Logger, NULL_LOGGER } from '../../logger';

// tslint:disable:unified-signatures
export class ɵMessageClient implements MessageClient, PreDestroy { // tslint:disable-line:class-name

  private readonly _destroy$ = new Subject<void>();
  private readonly _brokerGateway: BrokerGateway;

  constructor(clientAppName: string, private _config: { discoveryTimeout: number, deliveryTimeout: number }) {
    this._brokerGateway = new BrokerGateway(clientAppName, {discoveryTimeout: this._config.discoveryTimeout});
  }

  public publish<T = any>(topic: string, message?: T, options?: PublishOptions): Promise<void> {
    assertTopic(topic, {allowWildcardSegments: false});
    const headers = new Map(options && options.headers);
    const topicMessage: TopicMessage = {topic, retain: Defined.orElse(options && options.retain, false), headers: new Map(headers)};
    setBodyIfDefined(topicMessage, message);
    return this.postMessageToBroker(MessagingChannel.Topic, topicMessage);
  }

  public request$<T>(topic: string, request?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
    assertTopic(topic, {allowWildcardSegments: false});
    // IMPORTANT: In order to support multiple subscriptions to the returned Observable, initialization
    // must be done per subscription and each subscription must be given its own headers map instance.
    // The headers are copied on initialization to prevent modifications before the effective subscription.
    const headers = new Map(options && options.headers);
    return defer(() => {
      const topicMessage: TopicMessage = {topic, retain: false, headers: new Map(headers)};
      setBodyIfDefined(topicMessage, request);
      return this.postMessageToBrokerAndReceiveReplies$(MessagingChannel.Topic, topicMessage);
    });
  }

  public onMessage$<T>(topic: string): Observable<TopicMessage<T>> {
    assertTopic(topic, {allowWildcardSegments: true});
    // IMPORTANT: In order to support multiple subscriptions to the returned Observable, initialization must be done per subscription.
    return defer(() => this._onMessage$<T>(topic));
  }

  public issueIntent<T = any>(intent: Intent, body?: T, options?: MessageOptions): Promise<void> {
    assertIntentQualifier(intent.qualifier, {allowWildcards: false});
    const headers = new Map(options && options.headers);
    const intentMessage: IntentMessage = {intent, headers: new Map(headers)};
    setBodyIfDefined(intentMessage, body);
    return this.postMessageToBroker(MessagingChannel.Intent, intentMessage);
  }

  public requestByIntent$<T>(intent: Intent, body?: any, options?: MessageOptions): Observable<TopicMessage<T>> {
    assertIntentQualifier(intent.qualifier, {allowWildcards: false});
    // IMPORTANT: In order to support multiple subscriptions to the returned Observable, initialization
    // must be done per subscription and each subscription must be given its own headers map instance.
    // The headers are copied on initialization to prevent modifications before the effective subscription.
    const headers = new Map(options && options.headers);
    return defer(() => {
      const intentMessage: IntentMessage = {intent, headers: new Map(headers)};
      setBodyIfDefined(intentMessage, body);
      return this.postMessageToBrokerAndReceiveReplies$(MessagingChannel.Intent, intentMessage);
    });
  }

  public onIntent$<T>(selector?: Intent): Observable<IntentMessage<T>> {
    // IMPORTANT: In order to support multiple subscriptions to the returned Observable, initialization must be done per subscription.
    return defer(() => this._onIntent$<T>(selector));
  }

  public subscriberCount$(topic: string): Observable<number> {
    assertTopic(topic, {allowWildcardSegments: false});
    return this.request$<number>(PlatformTopics.RequestSubscriberCount, topic).pipe(mapToBody());
  }

  public isConnected(): Promise<boolean> {
    return this._brokerGateway.isConnected();
  }

  /**
   * Receives messages from the broker published to the given topic.
   */
  private _onMessage$<T>(topic: string): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      const unsubscribe$ = new Subject<void>();
      const subscriberId = UUID.randomUUID();

      // Receive messages sent to the given topic.
      this._brokerGateway.message$
        .pipe(
          filterByChannel<TopicMessage>(MessagingChannel.Topic),
          pluckMessage(),
          filterByHeader({key: MessageHeaders.ɵTopicSubscriberId, value: subscriberId}),
          map(message => ({...message, headers: copyMap(message.headers), params: copyMap(message.params)})),
          takeUntil(merge(this._destroy$, unsubscribe$)),
          finalize(() => {
            const command: TopicUnsubscribeCommand = {subscriberId, headers: new Map()};
            this.postMessageToBroker(MessagingChannel.TopicUnsubscribe, command)
              // Do not propagate unsubscription errors, only log them, e.g. when the broker is not available. Fall back using NULL_LOGGER when the platform is shutting down
              .catch(error => Beans.get(Logger, {orElseGet: NULL_LOGGER}).warn(`[TopicUnsubscribeError] Failed to unsubscribe from topic '${topic}'. Caused by: ${error}`));
          }),
        )
        .subscribe(observer);

      // Subscribe for the messages sent to the given topic.
      const topicSubscribeMessage: TopicSubscribeCommand = {subscriberId, topic, headers: new Map()};
      this.postMessageToBroker(MessagingChannel.TopicSubscribe, topicSubscribeMessage)
        // Do not propagate subscription errors, only log them, e.g. when the broker is not available. Fall back using NULL_LOGGER when the platform is shutting down
        .catch(error => Beans.get(Logger, {orElseGet: NULL_LOGGER}).warn(`[TopicSubscribeError] Failed to subscribe to topic '${topic}'. Caused by: ${error}`));

      return (): void => unsubscribe$.next();
    });
  }

  /**
   * Receives intents from the message broker for which this client has declared an intent.
   */
  private _onIntent$<T>(selector?: Intent): Observable<IntentMessage<T>> {
    return this._brokerGateway.message$
      .pipe(
        filterByChannel<IntentMessage<T>>(MessagingChannel.Intent),
        pluckMessage(),
        map(message => ({...message, headers: copyMap(message.headers)})),
        filter(message => !selector || !selector.type || selector.type === message.intent.type),
        filter(message => !selector || !selector.qualifier || matchesIntentQualifier(selector.qualifier, message.intent.qualifier)),
      );
  }

  /**
   * Posts a message to the message broker.
   *
   * @return A Promise that resolves upon successful delivery, or that rejects otherwise.
   */
  private postMessageToBroker(channel: MessagingChannel, message: Message): Promise<void> {
    const messageId = UUID.randomUUID();
    const deliveryError$ = new Subject<never>();

    const envelope: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: channel,
      message: message,
    };
    envelope.message.headers.set(MessageHeaders.MessageId, messageId);

    // Wait until the message is delivered.
    const whenPublished = merge(this._brokerGateway.message$, deliveryError$)
      .pipe(
        filterByTopic<MessageDeliveryStatus>(messageId),
        first(),
        timeoutWith(new Date(Date.now() + this._config.deliveryTimeout), throwError(`[MessageDispatchError] Broker did not report message delivery state within the ${this._config.deliveryTimeout}ms timeout. [envelope=${stringifyEnvelope(envelope)}]`)),
        takeUntil(this._destroy$),
        mergeMap(statusMessage => statusMessage.body.ok ? EMPTY : throwError(statusMessage.body.details)),
      )
      .toPromise();

    // Dispatch the message to the broker.
    this._brokerGateway.postMessage(envelope).catch(error => deliveryError$.error(error));

    return whenPublished.then(() => Promise.resolve()); // resolve to `void`;
  }

  /**
   * Posts a message to the message broker and receives replies.
   */
  private postMessageToBrokerAndReceiveReplies$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      message.headers.set(MessageHeaders.ReplyTo, UUID.randomUUID());
      const unsubscribe$ = new Subject<void>();
      const deliveryError$ = new Subject<void>();

      // Receive replies sent to the reply topic.
      this._onMessage$<T>(message.headers.get(MessageHeaders.ReplyTo))
        .pipe(takeUntil(merge(this._destroy$, unsubscribe$, deliveryError$)))
        .subscribe(next => observer.next(next), error => observer.error(error)); // dispatch next and error, but not complete

      // Post the message to the broker.
      this.postMessageToBroker(channel, message)
        .catch(error => {
          deliveryError$.next();
          observer.error(error);
        });

      return (): void => unsubscribe$.next();
    });
  }

  public preDestroy(): void {
    this._destroy$.next();
    this._brokerGateway.destroy();
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

/**
 * Creates a copy from the given `Map`.
 *
 * Data sent from one JavaScript realm to another is serialized with the structured clone algorithm.
 * Altought the algorithm supports the `Map` data type, a deserialized map object cannot be checked to be instance of `Map`.
 * This is most likely because the serialization takes place in a different realm.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * @see http://man.hubwiz.com/docset/JavaScript.docset/Contents/Resources/Documents/developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm.html
 */
function copyMap<K, V>(data: Map<K, V>): Map<K, V> {
  return new Map(data);
}

/**
 * Creates a string representation of the given {@link MessageEnvelope}.
 */
function stringifyEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope, (key, value) => (value instanceof Map) ? Dictionaries.coerce(value) : value);
}
