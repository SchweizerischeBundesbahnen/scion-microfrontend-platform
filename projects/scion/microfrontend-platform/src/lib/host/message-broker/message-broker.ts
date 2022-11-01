/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EMPTY, fromEvent, merge, MonoTypeOperatorFunction, Observable, of, pipe, Subject, tap} from 'rxjs';
import {catchError, filter, mergeMap, share, takeUntil} from 'rxjs/operators';
import {IntentMessage, Message, MessageHeaders, TopicMessage} from '../../messaging.model';
import {ConnackMessage, IntentSubscribeCommand, MessageDeliveryStatus, MessageEnvelope, MessagingChannel, MessagingTransport, PlatformTopics, TopicSubscribeCommand, UnsubscribeCommand} from '../../ɵmessaging.model';
import {ApplicationRegistry} from '../application-registry';
import {ManifestRegistry} from '../manifest-registry/manifest-registry';
import {UUID} from '@scion/toolkit/uuid';
import {Logger, LoggingContext} from '../../logger';
import {runSafe} from '../../safe-runner';
import {TopicSubscription, TopicSubscriptionRegistry} from './topic-subscription.registry';
import {ClientRegistry} from '../client-registry/client.registry';
import {chainInterceptors, IntentInterceptor, MessageInterceptor, PublishInterceptorChain} from './message-interception';
import {Beans, Initializer, PreDestroy} from '@scion/toolkit/bean-manager';
import {Runlevel} from '../../platform-state';
import {APP_IDENTITY, ɵVERSION} from '../../platform.model';
import {bufferUntil} from '@scion/toolkit/operators';
import {filterByChannel, filterByTransport} from '../../operators';
import {Client} from '../client-registry/client';
import {semver} from '../semver';
import {CLIENT_HEARTBEAT_INTERVAL} from '../client-registry/client.constants';
import {ɵClient} from '../client-registry/ɵclient';
import {stringifyError} from '../../error.util';
import {IntentSubscription, IntentSubscriptionRegistry} from './intent-subscription.registry';
import {RetainedMessageStore} from './retained-message-store';
import {TopicMatcher} from '../../topic-matcher.util';
import {SubscriptionLegacySupport} from '../../subscription-legacy-support';
import {Defined} from '@scion/toolkit/util';
import {MessageClient} from '../../client/messaging/message-client';

/**
 * The broker is responsible for receiving all messages, filtering the messages, determining who is
 * subscribed to each message, and sending the message to these subscribed clients.
 *
 * The broker allows topic-based and intent-based messaging and supports retained messages.
 *
 * When the broker receives a message from a client, the broker identifies the sending client using the {@Window}
 * contained in the {@link MessageEvent}. The user agent sets the window, which cannot be tampered by the client.
 * However, when the client unloads, the window is not set because already been destroyed. Then, the broker identifies
 * the client using the unique client id. In both cases, the broker checks the origin of the message to match the
 * origin of the registered application.
 *
 * The broker processes client connect requests in runlevel 1 or higher. Message dispatching is enabled in runlevel 2.
 * Prior requests are buffered until entering the respective runlevel.
 *
 * @ignore
 */
export class MessageBroker implements Initializer, PreDestroy {

  private readonly _destroy$ = new Subject<void>();
  private readonly _clientMessage$: Observable<MessageEvent<MessageEnvelope>>;

  private readonly _clientRegistry = Beans.get(ClientRegistry);
  private readonly _topicSubscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
  private readonly _intentSubscriptionRegistry = Beans.get(IntentSubscriptionRegistry);
  private readonly _retainedMessageRegistry = new RetainedMessageStore();

  private readonly _applicationRegistry: ApplicationRegistry;
  private readonly _manifestRegistry: ManifestRegistry;

  private readonly _messagePublisher: PublishInterceptorChain<TopicMessage>;
  private readonly _intentPublisher: PublishInterceptorChain<IntentMessage>;
  private readonly _heartbeatInterval: number;

  constructor() {
    this._applicationRegistry = Beans.get(ApplicationRegistry);
    this._manifestRegistry = Beans.get(ManifestRegistry);
    this._heartbeatInterval = Beans.get(CLIENT_HEARTBEAT_INTERVAL);

    // Construct a stream of messages sent by clients.
    this._clientMessage$ = fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByTransport(MessagingTransport.ClientToBroker),
        filterByChannel(MessagingChannel.Intent, MessagingChannel.Topic, MessagingChannel.TopicSubscribe, MessagingChannel.TopicUnsubscribe, MessagingChannel.IntentSubscribe, MessagingChannel.IntentUnsubscribe),
        bufferUntil(Beans.whenRunlevel(Runlevel.Two)),
        checkOriginTrusted(),
        sanitizeMessageHeaders(),
        catchErrorAndRetry(),
        share(),
      );

    // Install client connect listeners.
    this.installClientConnectListener();
    this.installClientDisconnectListener();

    // Install message dispatchers.
    this.installTopicMessageDispatcher();
    this.installTopicSubscribeListener();
    this.installTopicUnsubscribeListener();
    this.installTopicSubscriberCountObserver();
    this.sendRetainedTopicMessageOnSubscribe();

    // Install intent dispatchers.
    this.installIntentMessageDispatcher();
    this.installIntentSubscribeListener();
    this.installIntentUnsubscribeListener();

    // Assemble message interceptors to a chain of handlers which are called one after another. The publisher is added as terminal handler.
    this._messagePublisher = this.createMessagePublisher();
    this._intentPublisher = this.createIntentPublisher();
  }

  public init(): Promise<void> {
    return Promise.resolve();
  }

  private installClientConnectListener(): void {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByTransport(MessagingTransport.ClientToBroker),
        filterByChannel(MessagingChannel.ClientConnect),
        bufferUntil(Beans.whenRunlevel(Runlevel.One)),
        catchErrorAndRetry(),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent) => runSafe(() => {
        // Ignore stale CONNECT request, e.g. if the origin window has been closed or a page with a different origin has been loaded.
        if (!event.source) {
          Beans.get(Logger).debug(`[CONNECT] Ignoring stale connect request from "${event.origin}".`);
          return;
        }

        const eventSource: Window = event.source as Window;
        const envelope: MessageEnvelope<TopicMessage<void>> = event.data;
        const clientAppName = envelope.message.headers.get(MessageHeaders.AppSymbolicName);
        const clientMessageTarget = new MessageTarget(event);
        const replyTo = envelope.message.headers.get(MessageHeaders.ReplyTo);

        if (!clientAppName) {
          const warning = `Client connect attempt rejected by the message broker: Bad request. [origin='${event.origin}']`;
          Beans.get(Logger).warn(`[CONNECT] ${warning}`);
          sendTopicMessage<ConnackMessage>(clientMessageTarget, {
            topic: replyTo,
            body: {returnCode: 'refused:bad-request', returnMessage: `[MessageClientConnectError] ${warning}`},
            headers: new Map(),
          });
          return;
        }

        const application = this._applicationRegistry.getApplication(clientAppName);
        if (!application) {
          const warning = `Client connect attempt rejected by the message broker: Unknown client. [app='${clientAppName}']`;
          Beans.get(Logger).warn(`[CONNECT] ${warning}`);
          sendTopicMessage<ConnackMessage>(clientMessageTarget, {
            topic: replyTo,
            body: {returnCode: 'refused:rejected', returnMessage: `[MessageClientConnectError] ${warning}`},
            headers: new Map(),
          });
          return;
        }

        if (event.origin !== application.messageOrigin) {
          const warning = `Client connect attempt blocked by the message broker: Wrong origin [actual='${event.origin}', expected='${application.messageOrigin}', app='${application.symbolicName}']`;
          Beans.get(Logger).warn(`[CONNECT] ${warning}`);

          sendTopicMessage<ConnackMessage>(clientMessageTarget, {
            topic: replyTo,
            body: {returnCode: 'refused:blocked', returnMessage: `[MessageClientConnectError] ${warning}`},
            headers: new Map(),
          });
          return;
        }

        // Check if the client is already connected. If already connected, do nothing. A client can potentially initiate multiple connect requests, for example,
        // when not receiving connect confirmation in time.
        const currentClient = this._clientRegistry.getByWindow(eventSource);
        if (currentClient && currentClient.application.messageOrigin === event.origin && currentClient.application.symbolicName === application.symbolicName) {
          sendTopicMessage<ConnackMessage>(currentClient, {
            topic: replyTo,
            body: {returnCode: 'accepted', clientId: currentClient.id, heartbeatInterval: this._heartbeatInterval},
            headers: new Map(),
          });
          return;
        }

        const client = new ɵClient(UUID.randomUUID(), eventSource, application, envelope.message.headers.get(MessageHeaders.Version));
        this._clientRegistry.registerClient(client);

        // Check if the client is compatible with the platform version of the host.
        if (semver.major(client.version) !== semver.major(Beans.get<string>(ɵVERSION))) {
          Beans.get(Logger).warn(`[VersionMismatch] Application '${application.symbolicName}' uses a different major version of the @scion/microfrontend-platform than the host application, which may not be compatible. Please upgrade @scion/microfrontend-platform of application '${application.symbolicName}' from version '${(client.version)}' to version '${(Beans.get<string>(ɵVERSION))}'.`, new LoggingContext(application.symbolicName, client.version));
        }

        sendTopicMessage<ConnackMessage>(client, {
          topic: replyTo,
          body: {returnCode: 'accepted', clientId: client.id, heartbeatInterval: this._heartbeatInterval},
          headers: new Map(),
        });
      }));
  }

  /**
   * Listens for client disconnect requests.
   */
  private installClientDisconnectListener(): void {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByTransport(MessagingTransport.ClientToBroker),
        filterByChannel(MessagingChannel.ClientDisconnect),
        bufferUntil(Beans.whenRunlevel(Runlevel.One)),
        checkOriginTrusted(),
        catchErrorAndRetry(),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope>) => runSafe(() => {
        const client = getSendingClient(event);
        this._clientRegistry.unregisterClient(client);
      }));
  }

  /**
   * Replies to requests to observe the number of subscribers on a topic.
   */
  private installTopicSubscriberCountObserver(): void {
    Beans.get(MessageClient).observe$<string>(PlatformTopics.RequestSubscriberCount)
      .pipe(takeUntil(this._destroy$))
      .subscribe(request => {
        const topic = request.body!;
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const unsubscribe$ = this._topicSubscriptionRegistry.subscriptionCount$(replyTo).pipe(filter(count => count === 0));

        this._topicSubscriptionRegistry.subscriptionCount$(topic)
          .pipe(takeUntil(merge(this._destroy$, unsubscribe$)))
          .subscribe(count => Beans.get(MessageClient).publish(replyTo, count)); // eslint-disable-line rxjs/no-nested-subscribe
      });
  }

  /**
   * Dispatches topic messages to subscribed clients.
   */
  private installTopicMessageDispatcher(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<TopicMessage>(MessagingChannel.Topic),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<TopicMessage>>) => runSafe(async () => {
        const client = getSendingClient(event);
        const topicMessage = event.data.message;
        const messageId = topicMessage.headers.get(MessageHeaders.MessageId);

        if (!topicMessage.topic) {
          const error = '[TopicDispatchError] Missing property: topic';
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        try {
          await this._messagePublisher.interceptAndPublish(topicMessage);
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  /**
   * Dispatches intents to qualified clients.
   */
  private installIntentMessageDispatcher(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<IntentMessage>(MessagingChannel.Intent),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<IntentMessage>>) => runSafe(async () => {
        const client = getSendingClient(event);
        const intentMessage = event.data.message;
        const messageId = intentMessage.headers.get(MessageHeaders.MessageId);

        if (!intentMessage.intent) {
          const error = '[IntentDispatchError] Missing required property on message: intent';
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        if (!intentMessage.intent.type) {
          const error = '[IntentDispatchError] Missing required property on intent: type';
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        if (!this._manifestRegistry.hasIntention(intentMessage.intent, client.application.symbolicName)) {
          const error = `[NotQualifiedError] Application '${client.application.symbolicName}' is not qualified to publish intents of the type '${intentMessage.intent.type}' and qualifier '${JSON.stringify(intentMessage.intent.qualifier || {})}'. Ensure to have listed the intention in the application manifest.`;
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        // Find capabilities fulfilling the intent, or send an error otherwise.
        const capabilities = this._manifestRegistry.resolveCapabilitiesByIntent(intentMessage.intent, client.application.symbolicName);
        if (capabilities.length === 0) {
          const error = `[NullProviderError] No application found to provide a capability of the type '${intentMessage.intent.type}' and qualifiers '${JSON.stringify(intentMessage.intent.qualifier || {})}'. Maybe, the capability is not public API or the providing application not available.`;
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        try {
          await Promise.all(capabilities.map(capability => this._intentPublisher.interceptAndPublish({...intentMessage, capability})));
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  private sendRetainedTopicMessageOnSubscribe(): void {
    this._topicSubscriptionRegistry.register$
      .pipe(takeUntil(this._destroy$))
      .subscribe(subscription => {
        const retainedMessage = this._retainedMessageRegistry.findMostRecentRetainedMessage(subscription.topic);
        if (retainedMessage) {
          const headers = new Map(retainedMessage.headers).set(MessageHeaders.ɵSubscriberId, subscription.subscriberId);
          this._messagePublisher.interceptAndPublish({...retainedMessage, headers});
        }
      });
  }

  /**
   * Listens for topic subscription requests.
   */
  private installTopicSubscribeListener(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<TopicSubscribeCommand>(MessagingChannel.TopicSubscribe),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<TopicSubscribeCommand>>) => runSafe(() => {
        const client = getSendingClient(event);
        const envelope = event.data;
        const messageId = envelope.message.headers.get(MessageHeaders.MessageId);

        try {
          const subscriberId = Defined.orElseThrow(envelope.message.subscriberId, () => Error('[TopicSubscribeError] Missing property: subscriberId'));
          const topic = Defined.orElseThrow(envelope.message.topic, () => Error('[TopicSubscribeError] Missing property: topic'));
          this._topicSubscriptionRegistry.register(new TopicSubscription(topic, subscriberId, client));
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  /**
   * Listens for topic unsubscription requests.
   */
  private installTopicUnsubscribeListener(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<UnsubscribeCommand>(MessagingChannel.TopicUnsubscribe),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<UnsubscribeCommand>>) => runSafe(() => {
        const client = getSendingClient(event);
        const envelope = event.data;
        const messageId = envelope.message.headers.get(MessageHeaders.MessageId);

        try {
          const subscriberId = Defined.orElseThrow(envelope.message.subscriberId, () => Error('[TopicUnsubscribeError] Missing property: subscriberId'));
          this._topicSubscriptionRegistry.unregister({subscriberId});
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  /**
   * Listens for intent subscription requests.
   */
  private installIntentSubscribeListener(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<IntentSubscribeCommand>(MessagingChannel.IntentSubscribe),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<IntentSubscribeCommand>>) => runSafe(() => {
        const client = getSendingClient(event);
        const envelope = event.data;
        const messageId = envelope.message.headers.get(MessageHeaders.MessageId);

        try {
          const subscriberId = Defined.orElseThrow(envelope.message.subscriberId, () => Error('[IntentSubscribeError] Missing property: subscriberId'));
          this._intentSubscriptionRegistry.register(new IntentSubscription(envelope.message.selector || {}, subscriberId, client));
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  /**
   * Listens for intent unsubscription requests.
   */
  private installIntentUnsubscribeListener(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<UnsubscribeCommand>(MessagingChannel.IntentUnsubscribe),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<UnsubscribeCommand>>) => runSafe(() => {
        const client = getSendingClient(event);
        const envelope = event.data;
        const messageId = envelope.message.headers.get(MessageHeaders.MessageId);

        try {
          const subscriberId = Defined.orElseThrow(envelope.message.subscriberId, () => Error('[IntentUnsubscribeError] Missing property: subscriberId'));
          this._intentSubscriptionRegistry.unregister({subscriberId});
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  /**
   * Creates the interceptor chain to intercept message publishing. The publisher is added as terminal handler.
   */
  private createMessagePublisher(): PublishInterceptorChain<TopicMessage> {
    return chainInterceptors(Beans.all(MessageInterceptor), async (message: TopicMessage): Promise<void> => {
      // If the message is marked as 'retained', store it, or if without a body, delete it.
      if (message.retain && this._retainedMessageRegistry.persistOrDelete(message) === 'deleted') {
        return; // Deletion events for retained messages are swallowed.
      }

      const subscribers = this._topicSubscriptionRegistry.subscriptions({
        subscriberId: message.headers.get(MessageHeaders.ɵSubscriberId),
        topic: message.topic,
      });

      // If request-reply communication, reply with an error if no subscriber is registered to answer the request.
      if (message.headers.has(MessageHeaders.ReplyTo) && !subscribers.length) {
        throw Error(`[RequestReplyError] No subscriber registered to answer the request [topic=${message.topic}]`);
      }

      subscribers.forEach(subscriber => runSafe(() => sendTopicMessage(subscriber, message)));
    });
  }

  /**
   * Creates the interceptor chain to intercept intent publishing. The publisher is added as terminal handler.
   */
  private createIntentPublisher(): PublishInterceptorChain<IntentMessage> {
    return chainInterceptors(Beans.all(IntentInterceptor), async (message: IntentMessage): Promise<void> => {
      const subscribers = this._intentSubscriptionRegistry.subscriptions({
        subscriberId: message.headers.get(MessageHeaders.ɵSubscriberId),
        appSymbolicName: message.capability.metadata!.appSymbolicName,
        intent: message.intent,
      });

      // If request-reply communication, reply with an error if no subscriber is registered to answer the intent.
      if (message.headers.has(MessageHeaders.ReplyTo) && !subscribers.length) {
        throw Error(`[RequestReplyError] No subscriber registered to answer the intent [intent=${JSON.stringify(message.intent)}]`);
      }

      subscribers.forEach(subscriber => runSafe(() => sendIntentMessage(subscriber, message)));
    });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Resolves to the client that sent the passed message.
 *
 * Throws an error if the client could not be resolved.
 *
 * @ignore
 */
function getSendingClient(event: MessageEvent<MessageEnvelope>): Client {
  const clientId = event.data.message.headers.get(MessageHeaders.ClientId);
  const client = Beans.get(ClientRegistry).getByClientId(clientId)!;
  if (!client) {
    throw Error(`[NullClientError] Client not found in client registry. [clientId=${clientId}]`);
  }
  return client;
}

/**
 * Passes only messages originating from trusted and registered clients.
 *
 * @ignore
 */
function checkOriginTrusted<T extends Message>(): MonoTypeOperatorFunction<MessageEvent<MessageEnvelope<T>>> {
  return mergeMap((event: MessageEvent<MessageEnvelope<T>>): Observable<MessageEvent<MessageEnvelope<T>>> => {
    const envelope: MessageEnvelope = event.data;
    const messageId = envelope.message.headers.get(MessageHeaders.MessageId);
    const clientId = envelope.message.headers.get(MessageHeaders.ClientId);
    const client = Beans.get(ClientRegistry).getByClientId(clientId)!;

    // Assert client registration.
    if (!client) {
      if (event.source !== null) {
        const sender = new MessageTarget(event);
        const error = `[MessagingError] Message rejected: Client not registered [origin=${event.origin}]`;
        sendDeliveryStatusError(sender, messageId, error);
      }
      return EMPTY;
    }

    // Assert source origin.
    if (event.origin !== client.application.messageOrigin) {
      if (event.source !== null) {
        const sender = new MessageTarget(event);
        const error = `[MessagingError] Message rejected: Wrong origin [actual=${event.origin}, expected=${client.application.messageOrigin}, application=${client.application.symbolicName}]`;
        sendDeliveryStatusError(sender, messageId, error);
      }
      return EMPTY;
    }

    // Assert source window unless the request is stale, i.e., if the origin window has been closed or a site with a different origin has been loaded.
    // We still process stale requests to enable proper disconnection of the client, such as delivery of messages published by the client during shutdown,
    // but mark the client as stale and queue it for later removal.
    if (event.source === null) {
      client.markStaleAndQueueForRemoval();
    }
    else if (event.source !== client.window) {
      const sender = new MessageTarget(event);
      const error = `[MessagingError] Message rejected: Wrong window [origin=${event.origin}]`;
      sendDeliveryStatusError(sender, messageId, error);
      return EMPTY;
    }

    return of(event);
  });
}

/** @ignore */
function sendDeliveryStatusSuccess(target: MessageTarget | Client, topic: string): void {
  sendTopicMessage<MessageDeliveryStatus>(target, {
    topic: topic,
    body: {ok: true},
    headers: new Map(),
  });
}

/** @ignore */
function sendDeliveryStatusError(target: MessageTarget | Client, topic: string, error: string | Error | unknown): void {
  sendTopicMessage<MessageDeliveryStatus>(target, {
    topic: topic,
    body: {ok: false, details: stringifyError(error)},
    headers: new Map(),
  });
}

/** @ignore */
function sendTopicMessage<T>(target: MessageTarget | Client | TopicSubscription, message: TopicMessage<T>): void {
  const envelope: MessageEnvelope<TopicMessage<T>> = {
    transport: MessagingTransport.BrokerToClient,
    channel: MessagingChannel.Topic,
    message: {
      ...message,
      params: new Map(message.params || new Map()),
      headers: new Map(message.headers || new Map())
        .set(MessageHeaders.MessageId, message.headers.get(MessageHeaders.MessageId) ?? UUID.randomUUID())
        .set(MessageHeaders.AppSymbolicName, message.headers.get(MessageHeaders.AppSymbolicName) ?? Beans.get<string>(APP_IDENTITY)),
    },
  };

  if (target instanceof MessageTarget) {
    !target.window.closed && target.window.postMessage(envelope, target.origin);
  }
  else if (target instanceof TopicSubscription) {
    const subscription = target;
    const client = subscription.client;
    Beans.get(SubscriptionLegacySupport).setSubscriberMessageHeader(envelope, target.subscriberId, client.version);
    envelope.message.params = new TopicMatcher(subscription.topic).match(message.topic).params;
    !client.stale && client.window.postMessage(envelope, client.application.messageOrigin);
  }
  else {
    !target.stale && target.window.postMessage(envelope, target.application.messageOrigin);
  }
}

/** @ignore */
function sendIntentMessage(subscription: IntentSubscription, message: IntentMessage): void {
  const envelope: MessageEnvelope<IntentMessage> = {
    transport: MessagingTransport.BrokerToClient,
    channel: MessagingChannel.Intent,
    message: {
      ...message,
      headers: new Map(message.headers || new Map())
        .set(MessageHeaders.ɵSubscriberId, subscription.subscriberId)
        .set(MessageHeaders.MessageId, message.headers.get(MessageHeaders.MessageId) ?? UUID.randomUUID())
        .set(MessageHeaders.AppSymbolicName, message.headers.get(MessageHeaders.AppSymbolicName) ?? Beans.get<string>(APP_IDENTITY)),
    },
  };
  const client = subscription.client;
  !client.stale && client.window.postMessage(envelope, client.application.messageOrigin);
}

/**
 * Catches and logs errors, and resubscribes to the source observable.
 *
 * @ignore
 */
function catchErrorAndRetry<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error, caught) => {
    Beans.get(Logger).error('[UnexpectedError] An unexpected error occurred.', error);
    return caught;
  });
}

/**
 * Sanitizes message headers that should not be set by clients.
 */
function sanitizeMessageHeaders<T extends Message>(): MonoTypeOperatorFunction<MessageEvent<MessageEnvelope<T>>> {
  return pipe(
    /**
     * The subscriber identifier is set exclusively by the host when it dispatches a message to a subscribed client.
     */
    tap(event => event.data.message.headers.delete(MessageHeaders.ɵSubscriberId)),
  );
}

/**
 * Represents the target where to send a message.
 *
 * @ignore
 */
class MessageTarget {

  public readonly window: Window;
  public readonly origin: string;

  constructor(event: MessageEvent) {
    this.window = event.source as Window;
    this.origin = event.origin;
  }
}
