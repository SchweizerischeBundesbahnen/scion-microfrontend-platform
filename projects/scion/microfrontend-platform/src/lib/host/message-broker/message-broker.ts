/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EMPTY, fromEvent, MonoTypeOperatorFunction, Observable, of, Subject} from 'rxjs';
import {catchError, filter, mergeMap, share, takeUntil} from 'rxjs/operators';
import {IntentMessage, Message, MessageHeaders, TopicMessage} from '../../messaging.model';
import {ConnackMessage, MessageDeliveryStatus, MessageEnvelope, MessagingChannel, MessagingTransport, PlatformTopics, TopicSubscribeCommand, TopicUnsubscribeCommand} from '../../ɵmessaging.model';
import {ApplicationRegistry} from '../application-registry';
import {ManifestRegistry} from '../manifest-registry/manifest-registry';
import {Defined} from '@scion/toolkit/util';
import {UUID} from '@scion/toolkit/uuid';
import {Logger, LoggingContext} from '../../logger';
import {runSafe} from '../../safe-runner';
import {TopicSubscriptionRegistry} from './topic-subscription.registry';
import {ClientRegistry} from '../client-registry/client.registry';
import {RetainedMessageStore} from './retained-message-store';
import {TopicMatcher} from '../../topic-matcher.util';
import {chainInterceptors, IntentInterceptor, MessageInterceptor, PublishInterceptorChain} from './message-interception';
import {Beans, Initializer, PreDestroy} from '@scion/toolkit/bean-manager';
import {Runlevel} from '../../platform-state';
import {APP_IDENTITY, Capability, ParamDefinition} from '../../platform.model';
import {bufferUntil} from '@scion/toolkit/operators';
import {ParamMatcher} from './param-matcher';
import {filterByChannel, filterByTopicChannel, filterByTransport} from '../../operators';
import {Client} from '../client-registry/client';
import semver from 'semver';
import {VERSION} from '../../version';
import {CLIENT_HEARTBEAT_INTERVAL} from '../client-registry/client.constants';
import {ɵClient} from '../client-registry/ɵclient';
import {stringifyError} from '../../error.util';

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
        filterByChannel(MessagingChannel.Intent, MessagingChannel.Topic, MessagingChannel.TopicSubscribe, MessagingChannel.TopicUnsubscribe),
        bufferUntil(Beans.whenRunlevel(Runlevel.Two)),
        checkOriginTrusted(),
        catchErrorAndRetry(),
        share(),
      );

    // Install client connect listeners.
    this.installClientConnectListener();
    this.installClientDisconnectListener();

    // Install message dispatchers.
    this.installTopicMessageDispatcher();
    this.installIntentMessageDispatcher();

    // Install topic subscriptions listeners.
    this.installTopicSubscribeListener();
    this.installTopicUnsubscribeListener();
    this.installTopicSubscriberCountObserver();

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
        if (semver.major(client.version) !== semver.major(Beans.get<string>(VERSION))) {
          Beans.get(Logger).warn(`[VersionMismatch] Application '${application.symbolicName}' uses a different major version of the @scion/microfrontend-platform than the host application, which may not be compatible. Please upgrade @scion/microfrontend-platform of application '${application.symbolicName}' from version '${(client.version)}' to version '${(Beans.get<string>(VERSION))}'.`, new LoggingContext(application.symbolicName, client.version));
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
   * Listens for topic subscribe commands.
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
        const topic = envelope.message.topic;
        const subscriberId = envelope.message.subscriberId;
        const messageId = envelope.message.headers.get(MessageHeaders.MessageId);

        if (!topic) {
          sendDeliveryStatusError(client, messageId, '[TopicSubscribeError] Missing required property on message: topic');
          return;
        }
        if (!subscriberId) {
          sendDeliveryStatusError(client, messageId, '[TopicSubscribeError] Missing required property on message: subscriberId');
          return;
        }

        this._topicSubscriptionRegistry.subscribe(topic, client, subscriberId);
        sendDeliveryStatusSuccess(client, messageId);

        // Dispatch a retained message, if any.
        const retainedMessage = this._retainedMessageRegistry.findMostRecentRetainedMessage(topic);
        if (retainedMessage) {
          const retainedMessageWorkingCopy = {
            ...retainedMessage,
            headers: new Map(retainedMessage.headers).set(MessageHeaders.ɵTopicSubscriberId, subscriberId),
            params: new TopicMatcher(topic).match(retainedMessage.topic).params,
          };
          sendTopicMessage(client, retainedMessageWorkingCopy);
        }
      }));
  }

  /**
   * Listens for topic unsubscribe commands.
   */
  private installTopicUnsubscribeListener(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<TopicUnsubscribeCommand>(MessagingChannel.TopicUnsubscribe),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<TopicUnsubscribeCommand>>) => runSafe(() => {
        const client = getSendingClient(event);
        const envelope = event.data;
        const subscriberId = envelope.message.subscriberId;
        const messageId = envelope.message.headers.get(MessageHeaders.MessageId);

        if (!subscriberId) {
          sendDeliveryStatusError(client, messageId, '[TopicUnsubscribeError] Missing required property on message: subscriberId');
          return;
        }

        this._topicSubscriptionRegistry.unsubscribe(subscriberId);
        sendDeliveryStatusSuccess(client, messageId);
      }));
  }

  /**
   * Replies to requests to observe the number of subscribers on a topic.
   */
  private installTopicSubscriberCountObserver(): void {
    this._clientMessage$
      .pipe(
        filterByTopicChannel<string>(PlatformTopics.RequestSubscriberCount),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<TopicMessage<string>>>) => runSafe(() => {
        const client = getSendingClient(event);
        const request = event.data.message;
        const topic = request.body!;
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const messageId = request.headers.get(MessageHeaders.MessageId);
        sendDeliveryStatusSuccess(client, messageId);

        this._topicSubscriptionRegistry.subscriptionCount$(topic)
          .pipe(takeUntil(this._topicSubscriptionRegistry.subscriptionCount$(replyTo).pipe(filter(count => count === 0))))
          .subscribe((count: number) => runSafe(() => { // eslint-disable-line rxjs/no-nested-subscribe
            this.dispatchTopicMessage({
              topic: replyTo,
              body: count,
              headers: new Map()
                .set(MessageHeaders.MessageId, UUID.randomUUID())
                .set(MessageHeaders.AppSymbolicName, Beans.get<string>(APP_IDENTITY)),
            });
          }));
      }));
  }

  /**
   * Dispatches topic messages to subscribed clients.
   */
  private installTopicMessageDispatcher(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<TopicMessage>(MessagingChannel.Topic),
        filter(message => message.data.message.topic !== PlatformTopics.RequestSubscriberCount), // do not dispatch messages sent to the `RequestSubscriberCount` topic as handled separately
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<TopicMessage>>) => runSafe(() => {
        const client = getSendingClient(event);
        const topicMessage = event.data.message;
        const messageId = topicMessage.headers.get(MessageHeaders.MessageId);

        try {
          this._messagePublisher.publish(topicMessage);
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, stringifyError(error));
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
      .subscribe((event: MessageEvent<MessageEnvelope<IntentMessage>>) => runSafe(() => {
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

        // If the params of the intent do not match the params of every fulfilling capability, send an error.
        for (const capability of capabilities) {
          // Remove params with `undefined` as value.
          intentMessage.intent.params?.forEach((value, key) => {
            if (value === undefined) {
              intentMessage.intent.params!.delete(key);
            }
          });

          // Test params passed with the intent to match expected params as declared by the capability.
          const paramMatchResult = new ParamMatcher(capability.params!).match(intentMessage.intent.params);
          if (!paramMatchResult.matches) {
            const intentStringified = JSON.stringify(intentMessage.intent, (key, value) => (key === 'params') ? undefined : value);
            const error = `[ParamMismatchError] Params of the intent do not match expected params of the resolved capability. Ensure to pass required params and not to include additional params. [intent=${intentStringified}, missingParams=[${paramMatchResult.missingParams.map(param => param.name)}], unexpectedParams=[${paramMatchResult.unexpectedParams}]].`;
            sendDeliveryStatusError(client, messageId, error);
            return;
          }

          // Warn about the usage of deprecated params.
          if (paramMatchResult.deprecatedParams.length) {
            paramMatchResult.deprecatedParams.forEach(deprecatedParam => {
              const warning = constructDeprecatedParamWarning(deprecatedParam, {appSymbolicName: client.application.symbolicName});
              Beans.get(Logger).warn(`[DEPRECATION] ${warning}`, new LoggingContext(client.application.symbolicName, client.version), intentMessage.intent);
            });
            // Use the matcher's parameters to have deprecated params mapped to their replacement.
            intentMessage.intent.params = paramMatchResult.params!;
          }
        }

        try {
          capabilities.forEach(capability => this._intentPublisher.publish({...intentMessage, capability}));
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, stringifyError(error));
        }
      }));
  }

  /**
   * Creates the interceptor chain to intercept message publishing. The publisher is added as terminal handler.
   */
  private createMessagePublisher(): PublishInterceptorChain<TopicMessage> {
    return chainInterceptors(Beans.all(MessageInterceptor), (message: TopicMessage): void => {
      // If the message is marked as 'retained', store it, or if without a body, delete it.
      if (message.retain && this._retainedMessageRegistry.persistOrDelete(message) === 'deleted') {
        return; // Deletion events for retained messages are swallowed.
      }

      // Dispatch the message.
      const dispatched = this.dispatchTopicMessage(message);

      // If request-reply communication, throw an error if no replier is found to reply to the topic.
      if (!dispatched && message.headers.has(MessageHeaders.ReplyTo)) {
        throw Error(`[RequestReplyError] No client is currently running which could answer the request sent to the topic '${message.topic}'.`);
      }
    });
  }

  /**
   * Creates the interceptor chain to intercept intent publishing. The publisher is added as terminal handler.
   */
  private createIntentPublisher(): PublishInterceptorChain<IntentMessage> {
    return chainInterceptors(Beans.all(IntentInterceptor), (message: IntentMessage): void => {
      const capability = Defined.orElseThrow(message.capability, () => Error(`[IllegalStateError] Missing target capability on intent message: ${JSON.stringify(message)}`));
      const clients = this._clientRegistry.getByApplication(capability.metadata!.appSymbolicName);

      // If request-reply communication, send an error if no replier is running to reply to the intent.
      if (message.headers.has(MessageHeaders.ReplyTo) && !this.existsClient(capability)) {
        throw Error(`[RequestReplyError] No client is currently running which could answer the intent '{type=${message.intent.type}, qualifier=${JSON.stringify(message.intent.qualifier)}}'.`);
      }

      clients
        .filter(client => !client.stale)
        .forEach(client => runSafe(() => {
          const envelope: MessageEnvelope<IntentMessage> = {
            transport: MessagingTransport.BrokerToClient,
            channel: MessagingChannel.Intent,
            message: message,
          };
          client.window.postMessage(envelope, client.application.messageOrigin);
        }));
    });
  }

  /**
   * Dispatches the given topic message to subscribed clients on the transport {@link MessagingTransport.BrokerToClient}.
   *
   * @return `true` if dispatched the message to at minimum one subscriber, or `false` if no subscriber is subscribed to the given message topic.
   */
  private dispatchTopicMessage<BODY>(topicMessage: TopicMessage<BODY>): boolean {
    const destinations = this._topicSubscriptionRegistry.resolveTopicDestinations(topicMessage.topic);
    if (!destinations.length) {
      return false;
    }

    destinations.forEach(resolvedTopicDestination => runSafe(() => {
      const client: Client = resolvedTopicDestination.subscription.client;
      sendTopicMessage(client, {
        ...topicMessage,
        topic: resolvedTopicDestination.topic,
        params: resolvedTopicDestination.params,
        headers: new Map(topicMessage.headers).set(MessageHeaders.ɵTopicSubscriberId, resolvedTopicDestination.subscription.subscriberId),
      });
    }));

    return true;
  }

  /**
   * Tests if at least one client is running that can handle the specified capability.
   */
  private existsClient(capability: Capability): boolean {
    return this._clientRegistry.getByApplication(capability.metadata!.appSymbolicName).length > 0;
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
function sendDeliveryStatusError(target: MessageTarget | Client, topic: string, error: string): void {
  sendTopicMessage<MessageDeliveryStatus>(target, {
    topic: topic,
    body: {ok: false, details: error},
    headers: new Map(),
  });
}

/** @ignore */
function sendTopicMessage<T>(target: MessageTarget | Client, message: TopicMessage<T>): void {
  const envelope: MessageEnvelope<TopicMessage<T>> = {
    transport: MessagingTransport.BrokerToClient,
    channel: MessagingChannel.Topic,
    message: {...message},
  };

  envelope.message.params = new Map(envelope.message.params || new Map());
  envelope.message.headers = new Map(envelope.message.headers || new Map());

  const headers = envelope.message.headers;
  if (!headers.has(MessageHeaders.MessageId)) {
    headers.set(MessageHeaders.MessageId, UUID.randomUUID());
  }
  if (!headers.has(MessageHeaders.AppSymbolicName)) {
    headers.set(MessageHeaders.AppSymbolicName, Beans.get<string>(APP_IDENTITY));
  }

  if (target instanceof MessageTarget) {
    !target.window.closed && target.window.postMessage(envelope, target.origin);
  }
  else {
    !target.stale && target.window.postMessage(envelope, target.application.messageOrigin);
  }
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
 * @ignore
 */
function constructDeprecatedParamWarning(param: ParamDefinition, metadata: {appSymbolicName: string}): string {
  const deprecation = param.deprecated!;
  const useInstead = typeof deprecation === 'object' && deprecation.useInstead || undefined;
  const message = typeof deprecation === 'object' && deprecation.message || undefined;

  return new Array<string>()
    .concat(`Application '${metadata.appSymbolicName}' passes a deprecated parameter in the intent: '${param.name}'.`)
    .concat(useInstead ? `Pass parameter '${useInstead}' instead.` : [])
    .concat(message || [])
    .join(' ');
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
