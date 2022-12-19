/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EMPTY, from, fromEvent, merge, MonoTypeOperatorFunction, Observable, of, Subject} from 'rxjs';
import {catchError, filter, mergeMap, share, takeUntil} from 'rxjs/operators';
import {IntentMessage, Message, MessageHeaders, ResponseStatusCodes, TopicMessage} from '../../messaging.model';
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
import {APP_IDENTITY} from '../../platform.model';
import {ɵVERSION} from '../../ɵplatform.model';
import {bufferUntil} from '@scion/toolkit/operators';
import {filterByChannel, filterByTransport} from '../../operators';
import {Client} from '../client-registry/client';
import {semver} from '../semver';
import {ɵClient} from '../client-registry/ɵclient';
import {stringifyError} from '../../error.util';
import {IntentSubscription, IntentSubscriptionRegistry} from './intent-subscription.registry';
import {TopicMatcher} from '../../topic-matcher.util';
import {Defined, Maps} from '@scion/toolkit/util';
import {MessageClient} from '../../client/messaging/message-client';
import {Predicates} from './predicates.util';
import {Topics} from '../../topics.util';
import {Qualifiers} from '../../qualifiers.util';
import {IntentParams} from './intent-params.util';

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

  private readonly _retainedMessageStore = new Map<string, TopicMessage[]>();
  private readonly _retainedIntentStore = new Map<string, IntentMessage[]>();

  private readonly _applicationRegistry: ApplicationRegistry;
  private readonly _manifestRegistry: ManifestRegistry;

  private readonly _messagePublisher: PublishInterceptorChain<TopicMessage>;
  private readonly _intentPublisher: PublishInterceptorChain<IntentMessage>;

  constructor() {
    this._applicationRegistry = Beans.get(ApplicationRegistry);
    this._manifestRegistry = Beans.get(ManifestRegistry);

    // Construct a stream of messages sent by clients.
    this._clientMessage$ = fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByTransport(MessagingTransport.ClientToBroker),
        filterByChannel(MessagingChannel.Intent, MessagingChannel.Topic, MessagingChannel.TopicSubscribe, MessagingChannel.TopicUnsubscribe, MessagingChannel.IntentSubscribe, MessagingChannel.IntentUnsubscribe),
        bufferUntil(Beans.whenRunlevel(Runlevel.Two)),
        checkOriginTrusted(),
        catchErrorAndRetry(),
        share(),
      );

    // Install client connect listeners.
    this.installClientConnectListener();
    this.installClientDisconnectListener();

    // Install message handling.
    this.installMessageDispatcher();
    this.installTopicSubscribeListener();
    this.installTopicUnsubscribeListener();
    this.installTopicSubscriberCountObserver();
    this.sendRetainedMessageOnSubscribe();

    // Install intent handling.
    this.installIntentDispatcher();
    this.installIntentSubscribeListener();
    this.installIntentUnsubscribeListener();
    this.sendRetainedIntentOnSubscribe();
    this.deleteRetainedIntentOnCapabilityUnregister();

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
          const warning = `Client connect attempt rejected: Bad request. [origin='${event.origin}']`;
          Beans.get(Logger).warn(`[CONNECT] ${warning}`);
          sendTopicMessage<ConnackMessage>(clientMessageTarget, {
            topic: replyTo,
            body: {returnCode: 'refused:bad-request', returnMessage: `[ClientConnectError] ${warning}`},
            headers: new Map(),
          });
          return;
        }

        const application = this._applicationRegistry.getApplication(clientAppName);
        if (!application) {
          const warning = `Client connect attempt rejected: Unknown client. [app='${clientAppName}']`;
          Beans.get(Logger).warn(`[CONNECT] ${warning}`);
          sendTopicMessage<ConnackMessage>(clientMessageTarget, {
            topic: replyTo,
            body: {returnCode: 'refused:rejected', returnMessage: `[ClientConnectError] ${warning}`},
            headers: new Map(),
          });
          return;
        }

        if (!application.allowedMessageOrigins.has(event.origin)) {
          const warning = `Client connect attempt blocked: Wrong origin [actual='${event.origin}', expected='${Array.from(application.allowedMessageOrigins)}', app='${application.symbolicName}']`;
          Beans.get(Logger).warn(`[CONNECT] ${warning}`);

          sendTopicMessage<ConnackMessage>(clientMessageTarget, {
            topic: replyTo,
            body: {returnCode: 'refused:blocked', returnMessage: `[ClientConnectError] ${warning}`},
            headers: new Map(),
          });
          return;
        }

        // Check if the client is already connected. If already connected, do nothing. A client can potentially initiate multiple connect requests, for example,
        // when not receiving connect confirmation in time.
        const currentClient = this._clientRegistry.getByWindow(eventSource);
        if (currentClient && currentClient.origin === event.origin && currentClient.application.symbolicName === application.symbolicName) {
          sendTopicMessage<ConnackMessage>(currentClient, {
            topic: replyTo,
            body: {
              returnCode: 'accepted',
              clientId: currentClient.id,
              // Clients older than version `1.0.0-rc.11` expect the host to include the heartbeat interval in the connect acknowledgment.
              // If not, they would send a heartbeat constantly, thus overloading the message bus.
              ...(currentClient.deprecations.legacyHeartbeatLivenessProtocol ? {heartbeatInterval: 24 * 60 * 60 * 1000} as Partial<ConnackMessage> : {}),
            },
            headers: new Map(),
          });
          return;
        }

        const client = new ɵClient(UUID.randomUUID(), eventSource, event.origin, application, envelope.message.headers.get(MessageHeaders.Version));
        this._clientRegistry.registerClient(client);

        // Check if the client is compatible with the platform version of the host.
        if (semver.major(client.version) !== semver.major(Beans.get<string>(ɵVERSION))) {
          Beans.get(Logger).warn(`[VersionMismatch] Application '${application.symbolicName}' uses a different major version of the @scion/microfrontend-platform than the host application, which may not be compatible. Please upgrade @scion/microfrontend-platform of application '${application.symbolicName}' from version '${(client.version)}' to version '${(Beans.get<string>(ɵVERSION))}'.`, new LoggingContext(application.symbolicName, client.version));
        }

        sendTopicMessage<ConnackMessage>(client, {
          topic: replyTo,
          body: {
            returnCode: 'accepted',
            clientId: client.id,
            // Clients older than version `1.0.0-rc.11` expect the host to include the heartbeat interval in the connect acknowledgment.
            // If not, they would send a heartbeat constantly, thus overloading the message bus.
            ...(client.deprecations.legacyHeartbeatLivenessProtocol ? {heartbeatInterval: 24 * 60 * 60 * 1000} as Partial<ConnackMessage> : {}),
          },
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
      .subscribe(request => runSafe(() => {
        const topic = request.body!;
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const unsubscribe$ = this._topicSubscriptionRegistry.subscriptionCount$(replyTo).pipe(filter(count => count === 0));

        this._topicSubscriptionRegistry.subscriptionCount$(topic)
          .pipe(takeUntil(merge(this._destroy$, unsubscribe$)))
          .subscribe({ // eslint-disable-line rxjs/no-nested-subscribe
            next: count => Beans.get(MessageClient).publish(replyTo, count),
            error: error => Beans.get(MessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)}),
          });
      }));
  }

  /**
   * Dispatches topic messages to subscribed clients.
   */
  private installMessageDispatcher(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<TopicMessage>(MessagingChannel.Topic),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<TopicMessage>>) => runSafe(async () => {
        const client = getSendingClient(event);
        const message = event.data.message;
        const messageId = message.headers.get(MessageHeaders.MessageId);

        const illegalTopicError = Topics.validateTopic(message.topic, {exactTopic: true});
        if (illegalTopicError) {
          sendDeliveryStatusError(client, messageId, illegalTopicError);
          return;
        }

        // If a retained message without payload, remove any stored retained message on that topic, if any.
        if (message.retain && !isRequest(message) && message.body === undefined) {
          Maps.removeListValue(this._retainedMessageStore, message.topic, Predicates.not(isRequest));
          sendDeliveryStatusSuccess(client, messageId);
          return;
        }

        try {
          // If a request of a request-response communication, create a subscription for the requestor to receive replies.
          const requestorReplySubscription = this.subscribeForRepliesIfRequest(message, client);
          // Ensure the message header 'ɵSUBSCRIBER_ID' to be removed; is set in request-response communication by the client gateway.
          message.headers.delete(MessageHeaders.ɵSubscriberId);
          // Dispatch the message.
          await this._messagePublisher.interceptAndPublish(message);
          // If a retained message or request, store it for late subscribers.
          this.storeMessageIfRetained(message, requestorReplySubscription);

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
  private installIntentDispatcher(): void {
    this._clientMessage$
      .pipe(
        filterByChannel<IntentMessage>(MessagingChannel.Intent),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MessageEvent<MessageEnvelope<IntentMessage>>) => runSafe(async () => {
        const client = getSendingClient(event);
        const message = event.data.message;
        const messageId = message.headers.get(MessageHeaders.MessageId);

        if (!message.intent) {
          const error = '[MessagingError] Missing message property: intent';
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        if (!message.intent.type) {
          const error = '[MessagingError] Missing message property: type';
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        const illegalQualifierError = Qualifiers.validateQualifier(message.intent.qualifier, {exactQualifier: true});
        if (illegalQualifierError) {
          sendDeliveryStatusError(client, messageId, illegalQualifierError);
          return;
        }

        if (!this._manifestRegistry.hasIntention(message.intent, client.application.symbolicName)) {
          const error = `[NotQualifiedError] Application '${client.application.symbolicName}' is not qualified to publish intents of the type '${message.intent.type}' and qualifier '${JSON.stringify(message.intent.qualifier || {})}'. Ensure to have listed the intention in the application manifest.`;
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        // Find capabilities fulfilling the intent, or send an error otherwise.
        const capabilities = this._manifestRegistry.resolveCapabilitiesByIntent(message.intent, client.application.symbolicName);
        if (capabilities.length === 0) {
          const error = `[NullProviderError] No application found to provide a capability of the type '${message.intent.type}' and qualifiers '${JSON.stringify(message.intent.qualifier || {})}'. Maybe, the capability is not public API or the providing application not available.`;
          sendDeliveryStatusError(client, messageId, error);
          return;
        }

        // If a retained message without payload, remove any stored retained message for the resolved capabilities.
        if (message.retain && !isRequest(message) && message.body === undefined) {
          capabilities.forEach(capability => {
            Maps.removeListValue(this._retainedIntentStore, capability.metadata!.id, Predicates.not(isRequest));
            sendDeliveryStatusSuccess(client, messageId);
          });
          return;
        }

        try {
          // If a request of a request-response communication, create a subscription for the requestor to receive replies.
          const requestorReplySubscription = this.subscribeForRepliesIfRequest(message, client);
          // Ensure the message header 'ɵSUBSCRIBER_ID' to be removed; is set in request-response communication by the client gateway.
          message.headers.delete(MessageHeaders.ɵSubscriberId);

          // Dispatch the message.
          await Promise.all(capabilities
            // Associate capability with the intent.
            .map<IntentMessage>(capability => ({...message, capability}))
            .map(async message => {
              // Validate intent params.
              IntentParams.validateParams(message);
              // Publish the intent.
              await this._intentPublisher.interceptAndPublish(message);
              // If a retained message or request, store it for late subscribers.
              this.storeIntentIfRetained(message, requestorReplySubscription);
            }));
          sendDeliveryStatusSuccess(client, messageId);
        }
        catch (error) {
          sendDeliveryStatusError(client, messageId, error);
        }
      }));
  }

  /**
   * Installs a listener that sends retained messages to new subscribers.
   */
  private sendRetainedMessageOnSubscribe(): void {
    this._topicSubscriptionRegistry.register$
      .pipe(takeUntil(this._destroy$))
      .subscribe(subscription => runSafe(() => {
        Array.from(this._retainedMessageStore.values())
          .flat()
          .filter(retainedMessage => subscription.matches(retainedMessage.topic))
          .forEach(retainedMessage => this._messagePublisher.interceptAndPublish({
            ...retainedMessage,
            headers: new Map(retainedMessage.headers).set(MessageHeaders.ɵSubscriberId, subscription.subscriberId),
          }));
      }));
  }

  /**
   * Installs a listener that sends retained intents to new subscribers.
   */
  private sendRetainedIntentOnSubscribe(): void {
    this._intentSubscriptionRegistry.register$
      .pipe(takeUntil(this._destroy$))
      .subscribe(subscription => runSafe(() => {
        Array.from(this._retainedIntentStore.values())
          .flat()
          .filter(retainedMessage => subscription.client.application.symbolicName === retainedMessage.capability.metadata!.appSymbolicName)
          .filter(retainedMessage => subscription.matches(retainedMessage.intent))
          .forEach(retainedMessage => this._intentPublisher.interceptAndPublish({
            ...retainedMessage,
            headers: new Map(retainedMessage.headers).set(MessageHeaders.ɵSubscriberId, subscription.subscriberId),
          }));
      }));
  }

  /**
   * Installs a listener that removes retained intent(s) when associated capability is removed.
   */
  private deleteRetainedIntentOnCapabilityUnregister(): void {
    this._manifestRegistry.capabilityUnregister$
      .pipe(
        mergeMap(capabilities => from(capabilities)),
        takeUntil(this._destroy$),
      )
      .subscribe(capability => runSafe(() => {
        Maps.removeListValue(this._retainedIntentStore, capability.metadata!.id, Predicates.alwaysTrue);
      }));
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
        const topic = envelope.message.topic;

        const illegalTopicError = Topics.validateTopic(topic, {exactTopic: false});
        if (illegalTopicError) {
          sendDeliveryStatusError(client, messageId, illegalTopicError);
          return;
        }

        try {
          const subscriberId = Defined.orElseThrow(envelope.message.subscriberId, () => Error('[TopicSubscribeError] Missing property: subscriberId'));
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

        const illegalQualifierError = Qualifiers.validateQualifier(envelope.message.selector?.qualifier, {exactQualifier: false});
        if (illegalQualifierError) {
          sendDeliveryStatusError(client, messageId, illegalQualifierError);
          return;
        }

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
      const subscribers = this._topicSubscriptionRegistry.subscriptions({
        subscriberId: message.headers.get(MessageHeaders.ɵSubscriberId),
        topic: message.topic,
      });

      // If request-reply communication, reply with an error if no subscriber is registered to answer the request.
      if (isRequest(message) && !message.retain && !subscribers.length) {
        throw Error(`[MessagingError] No subscriber registered to answer the request [topic=${message.topic}]`);
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
      if (isRequest(message) && !message.retain && !subscribers.length) {
        throw Error(`[MessagingError] No subscriber registered to answer the intent [intent=${JSON.stringify(message.intent)}]`);
      }

      subscribers.forEach(subscriber => runSafe(() => sendIntentMessage(subscriber, message)));
    });
  }

  /**
   * Create a subscription for the sender to receive replies if request-response communication.
   */
  private subscribeForRepliesIfRequest(message: Message, sender: Client): TopicSubscription | null {
    if (!isRequest(message)) {
      return null;
    }
    if (sender.deprecations.legacyRequestResponseSubscriptionProtocol) {
      return null;
    }

    const subscriberId = Defined.orElseThrow(message.headers.get(MessageHeaders.ɵSubscriberId), () => Error('[MessagingError] Missing message header: subscriberId'));
    const replyTo = message.headers.get(MessageHeaders.ReplyTo);
    const subscription = new TopicSubscription(replyTo, subscriberId, sender);
    this._topicSubscriptionRegistry.register(subscription);
    return subscription;
  }

  /**
   * Stores the message if retained.
   *
   * Unlike a regular message, a retained message remains in the broker and is delivered to new subscribers, even if they subscribe
   * after the request has been sent. The broker stores one retained message per topic, i.e., a later sent retained message will replace
   * a previously sent retained message. This, however, does not apply to retained requests in request-response communication.
   * Retained requests are NEVER replaced and remain in the broker until the requestor unsubscribes.
   *
   * @param message - Message to be stored if retained.
   * @param requestorReplySubscription - Subscription of the requestor to receive replies; only set in request-response communication.
   */
  private storeMessageIfRetained(message: TopicMessage, requestorReplySubscription: TopicSubscription | null): void {
    if (!message.retain) {
      return;
    }

    // If a retained request, store it. Retained requests are not replaced and are retained until the requestor unsubscribes.
    if (isRequest(message)) {
      Defined.orElseThrow(requestorReplySubscription, () => Error('[InternalMessagingError] An unexpected error occurred. Expected subscription not to be null.'));
      Maps.addListValue(this._retainedMessageStore, message.topic, message);
      requestorReplySubscription!.whenUnsubscribe.then(() => Maps.removeListValue(this._retainedMessageStore, message.topic, message));
    }
    // If a retained message (not a request), replace any previously stored retained message on that topic, if any.
    else {
      Maps.removeListValue(this._retainedMessageStore, message.topic, Predicates.not(isRequest));
      Maps.addListValue(this._retainedMessageStore, message.topic, message);
    }
  }

  private storeIntentIfRetained(message: IntentMessage, requestorReplySubscription: TopicSubscription | null): void {
    if (!message.retain) {
      return;
    }

    const capabilityId = message.capability.metadata!.id;

    // If a retained request, store it. Retained requests are not replaced and are retained until the requestor unsubscribes.
    if (isRequest(message)) {
      Defined.orElseThrow(requestorReplySubscription, () => Error('[InternalMessagingError] An unexpected error occurred. Expected subscription not to be null.'));
      Maps.addListValue(this._retainedIntentStore, capabilityId, message);
      requestorReplySubscription!.whenUnsubscribe.then(() => Maps.removeListValue(this._retainedIntentStore, capabilityId, message));
    }
    // If a retained message (i.e. not a request), replace any previously stored retained message for that capability, if any.
    else {
      Maps.removeListValue(this._retainedIntentStore, capabilityId, Predicates.not(isRequest));
      Maps.addListValue(this._retainedIntentStore, capabilityId, message);
    }
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
    if (event.origin !== client.origin) {
      if (event.source !== null) {
        const sender = new MessageTarget(event);
        const error = `[MessagingError] Message rejected: Wrong origin [actual=${event.origin}, expected=${client.origin}, application=${client.application.symbolicName}]`;
        sendDeliveryStatusError(sender, messageId, error);
      }
      return EMPTY;
    }

    // Assert the source window unless it is `null`, that is, it has been closed or a page from another origin has been loaded into the window.
    // We still process requests of stale clients to enable proper disconnection, such as delivery of messages published by the client during shutdown.
    if (event.source !== null && event.source !== client.window) {
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
      params: new Map(message.params),
      headers: new Map(message.headers)
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
    envelope.message.headers.set(client.deprecations.legacyIntentSubscriptionProtocol ? 'ɵTOPIC_SUBSCRIBER_ID' : MessageHeaders.ɵSubscriberId, target.subscriberId);
    envelope.message.params = new TopicMatcher(subscription.topic).match(message.topic).params;
    !client.stale && client.window.postMessage(envelope, client.origin);
  }
  else {
    !target.stale && target.window.postMessage(envelope, target.origin);
  }
}

/** @ignore */
function sendIntentMessage(subscription: IntentSubscription, message: IntentMessage): void {
  const envelope: MessageEnvelope<IntentMessage> = {
    transport: MessagingTransport.BrokerToClient,
    channel: MessagingChannel.Intent,
    message: {
      ...message,
      headers: new Map(message.headers)
        .set(MessageHeaders.ɵSubscriberId, subscription.subscriberId)
        .set(MessageHeaders.MessageId, message.headers.get(MessageHeaders.MessageId) ?? UUID.randomUUID())
        .set(MessageHeaders.AppSymbolicName, message.headers.get(MessageHeaders.AppSymbolicName) ?? Beans.get<string>(APP_IDENTITY)),
    },
  };
  const client = subscription.client;
  !client.stale && client.window.postMessage(envelope, client.origin);
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
 * Tests whether given message is a request of a request-response communication.
 * That is a message that contains the {@link MessageHeaders#ReplyTo} message header.
 */
function isRequest(message: Message): boolean {
  return message.headers.has(MessageHeaders.ReplyTo);
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
