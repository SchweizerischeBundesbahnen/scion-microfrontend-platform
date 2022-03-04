/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EMPTY, fromEvent, interval, merge, MonoTypeOperatorFunction, NEVER, noop, Observable, Observer, of, ReplaySubject, Subject, TeardownLogic, throwError} from 'rxjs';
import {ConnackMessage, MessageDeliveryStatus, MessageEnvelope, MessagingChannel, MessagingTransport, PlatformTopics, TopicSubscribeCommand, TopicUnsubscribeCommand} from '../../ɵmessaging.model';
import {finalize, map, mergeMap, take, takeUntil, tap, timeoutWith} from 'rxjs/operators';
import {filterByChannel, filterByMessageHeader, filterByOrigin, filterByTopicChannel, filterByTransport, pluckMessage} from '../../operators';
import {UUID} from '@scion/toolkit/uuid';
import {IntentMessage, Message, MessageHeaders, TopicMessage} from '../../messaging.model';
import {Logger, NULL_LOGGER} from '../../logger';
import {Dictionaries} from '@scion/toolkit/util';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {APP_IDENTITY, IS_PLATFORM_HOST} from '../../platform.model';
import {PlatformState, Runlevel} from '../../platform-state';
import {ConnectOptions} from '../connect-options';
import {MicrofrontendPlatformRef} from '../../microfrontend-platform-ref';
import {MessageClient} from '../../client/messaging/message-client';
import {runSafe} from '../../safe-runner';
import {VERSION} from '../../version';

/**
 * The gateway is responsible for dispatching messages between the client and the broker.
 *
 * To initiate a connection, the gateway sends a CONNECT message to the current and all parent windows. When the broker window
 * receives the CONNECT message, the broker responds with a CONNACK message. If no CONNACK message is received within the discovery
 * timeout, the gateway errors. When the gateway is being disposed, it sends a DISCONNECT message to the broker.
 *
 * @ignore
 */
export abstract class BrokerGateway {

  /**
   * Returns a Promise that resolves after a connection to the broker could be established, or which rejects otherwise,
   * e.g., due to an error, or because the gateway is not allowed to connect, or because the `brokerDiscoverTimeout`
   * time has elapsed. The connect timeout timer only starts after entering runlevel 1.
   */
  public abstract whenConnected(): Promise<void>;

  /**
   * Returns whether this gateway is connected to the message broker. It never throws a broker discovery timeout error.
   */
  public abstract isConnected(): Promise<boolean>;

  /**
   * Posts a message to the message broker. If not connected to the broker yet, waits posting the message
   * until established the connection to the broker.
   *
   * @return a Promise that resolves when successfully posted the message to the broker, or that rejects otherwise.
   */
  public abstract postMessage(channel: MessagingChannel, message: Message): Promise<void>;

  /**
   * Posts a message to the message broker and receives replies. The Observable never completes.
   */
  public abstract requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>>;

  /**
   * Subscribes to messages published to the given topic. The Observable never completes.
   */
  public abstract subscribeToTopic$<T>(topic: string): Observable<TopicMessage<T>>;

  /**
   * An Observable that emits when a message from the message broker is received.
   */
  public abstract get message$(): Observable<MessageEvent<MessageEnvelope>>;
}

/**
 * Broker gateway that does nothing.
 *
 * Use this gateway in tests to not connect to the platform host.
 *
 * @ignore
 */
export class NullBrokerGateway implements BrokerGateway {

  constructor() {
    console.log('[NullBrokerGateway] Using \'NullBrokerGateway\'. Messages cannot be sent or received.');
  }

  public isConnected(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public whenConnected(): Promise<void> {
    return Promise.resolve();
  }

  public get message$(): Observable<MessageEvent<MessageEnvelope>> {
    return NEVER;
  }

  public async postMessage(channel: MessagingChannel, message: Message): Promise<void> {
    return Promise.resolve();
  }

  public requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>> {
    return NEVER;
  }

  public subscribeToTopic$<T>(topic: string): Observable<TopicMessage<T>> {
    return NEVER;
  }
}

/**
 * @ignore
 */
export class ɵBrokerGateway implements BrokerGateway, PreDestroy {

  /*
   * This Observable is primarily used as a notifier for the `takeUntil` operator to complete Observable subscriptions when the platform is shutting down.
   * Since some subscriptions trigger subsequent broker interactions, e.g., unsubscribing from a topic subscription, the notifier must "replay" its state
   * to avoid waiting for broker responses, which would never arrive and otherwise cause timeout errors.
   */
  private _platformStopping$ = new ReplaySubject<void>(1);
  private _appSymbolicName: string;
  private _brokerDiscoverTimeout: number;
  private _messageDeliveryTimeout: number;
  private _whenBrokerInfo: Promise<BrokerInfo>;
  private _brokerInfo: BrokerInfo | null = null;
  public readonly message$ = new Subject<MessageEvent<MessageEnvelope>>();

  constructor(connectOptions?: ConnectOptions) {
    this._appSymbolicName = Beans.get<string>(APP_IDENTITY);
    this._brokerDiscoverTimeout = connectOptions?.brokerDiscoverTimeout ?? 10_000;
    this._messageDeliveryTimeout = connectOptions?.messageDeliveryTimeout ?? 10_000;
    this._whenBrokerInfo = this.initGateway().then(brokerInfo => this._brokerInfo = brokerInfo);
  }

  private async initGateway(): Promise<BrokerInfo> {
    // If running in the host, wait connecting to the broker until entering runlevel 1, because in runlevel 0,
    // the broker is initialized.
    if (Beans.get(IS_PLATFORM_HOST)) {
      await Beans.whenRunlevel(Runlevel.One);
    }

    // Connect to the broker.
    const brokerInfo = await this.connectToBroker();

    // Subscribes to messages sent to this client.
    this.installBrokerMessageListener(brokerInfo);
    // Periodically send a heartbeat to indicate to be connected to the host.
    this.installHeartbeatPublisher(brokerInfo);

    return brokerInfo;
  }

  public isConnected(): Promise<boolean> {
    return this._whenBrokerInfo.then(() => true).catch(() => false);
  }

  public async whenConnected(): Promise<void> {
    await this._whenBrokerInfo;
  }

  public async postMessage(channel: MessagingChannel, message: Message): Promise<void> {
    if (isPlatformStopped()) {
      throw Error('[MessageDispatchError] Platform is stopped. Messages cannot be published or received.');
    }

    // Wait until connected to the broker.
    const brokerInfo = this._brokerInfo || await this._whenBrokerInfo; // Do not spawn a microtask when broker info is already available.

    const messageId = UUID.randomUUID();
    const envelope: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: channel,
      message: message,
    };
    envelope.message.headers
      .set(MessageHeaders.MessageId, messageId)
      .set(MessageHeaders.Timestamp, Date.now())
      .set(MessageHeaders.AppSymbolicName, this._appSymbolicName)
      .set(MessageHeaders.ClientId, brokerInfo.clientId);

    // Install Promise that resolves once the broker has acknowledged the message, or that rejects otherwise.
    const postError$ = new Subject<never>();
    const whenPosted = merge(this.message$, postError$)
      .pipe(
        filterByTopicChannel<MessageDeliveryStatus>(messageId),
        take(1),
        pluckMessage(),
        timeoutWith(new Date(Date.now() + this._messageDeliveryTimeout), throwError(`[MessageDispatchError] Broker did not report message delivery state within the ${this._messageDeliveryTimeout}ms timeout. [envelope=${stringifyEnvelope(envelope)}]`)),
        mergeMap(statusMessage => statusMessage.body!.ok ? EMPTY : throwError(statusMessage.body!.details)),
        takeUntil(this._platformStopping$),
      )
      .toPromise();

    try {
      brokerInfo.window.postMessage(envelope, brokerInfo.origin);
    }
    catch (error) {
      postError$.error(error);
    }

    await whenPosted;
  }

  public requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      if (isPlatformStopped()) {
        observer.error('[MessageDispatchError] Platform is stopped. Messages cannot be published or received.');
        return noop;
      }

      const replyTo = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const requestError$ = new Subject<never>();

      // Add 'ReplyTo' topic to the message headers where to receive the response(s).
      message.headers.set(MessageHeaders.ReplyTo, replyTo);

      // Receive replies sent to the reply topic.
      merge(this.subscribeToTopic$<T>(replyTo), requestError$)
        .pipe(takeUntil(merge(this._platformStopping$, unsubscribe$)))
        .subscribe({
          next: reply => observer.next(reply),
          error: error => observer.error(error),
          complete: noop, // As per the API, the Observable never completes.
        });

      // Post the request to the broker.
      this.postMessage(channel, message)
        .catch(error => requestError$.error(error));

      return (): void => unsubscribe$.next();
    });
  }

  public subscribeToTopic$<T>(topic: string): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      if (isPlatformStopped()) {
        observer.error('[MessageDispatchError] Platform is stopped. Messages cannot be published or received.');
        return noop;
      }

      const subscriberId = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const subscribeError$ = new Subject<never>();

      // Receive messages sent to the given topic.
      merge(this.message$, subscribeError$)
        .pipe(
          filterByChannel<TopicMessage>(MessagingChannel.Topic),
          filterByMessageHeader({key: MessageHeaders.ɵTopicSubscriberId, value: subscriberId}),
          pluckMessage(),
          takeUntil(merge(this._platformStopping$, unsubscribe$)),
          finalize(() => this.unsubscribeFromTopic(topic, subscriberId)),
        )
        .subscribe({
          next: reply => observer.next(reply),
          error: error => observer.error(error),
          complete: noop, // As per the API, the Observable never completes.
        });

      // Post the topic subscription to the broker.
      const topicSubscribeMessage: TopicSubscribeCommand = {subscriberId, topic, headers: new Map()};
      this.postMessage(MessagingChannel.TopicSubscribe, topicSubscribeMessage)
        .catch(error => subscribeError$.error(error));

      return (): void => unsubscribe$.next();
    });
  }

  /**
   * Unsubscribes given topic subscription. Does nothing if the platform is stopped.
   */
  private async unsubscribeFromTopic(topic: string, subscriberId: string): Promise<void> {
    if (isPlatformStopped()) {
      return;
    }

    const topicUnsubscribeCommand: TopicUnsubscribeCommand = {subscriberId, headers: new Map()};
    try {
      await this.postMessage(MessagingChannel.TopicUnsubscribe, topicUnsubscribeCommand);
    }
    catch (error) {
      Beans.get(Logger, {orElseGet: NULL_LOGGER}).error(`[TopicUnsubscribeError] Failed to unsubscribe from topic '${topic}'. Caused by: ${error}`);  // Fall back using NULL_LOGGER, e.g., when the platform is stopping.
    }
  }

  /**
   * Subscribes to messages sent to this client.
   * Messages are dispatched to {@link message$}.
   */
  private installBrokerMessageListener(brokerInfo: BrokerInfo): void {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByOrigin(brokerInfo.origin),
        filterByTransport(MessagingTransport.BrokerToClient),
        fixMapObjects(),
        takeUntil(this._platformStopping$),
      )
      .subscribe(this.message$);
  }

  /**
   * Installs a scheduler that periodically sends a heartbeat to indicate that this client is connected to the host.
   *
   * Note that no heartbeat scheduler is installed if running in the context of the host application.
   */
  private installHeartbeatPublisher(brokerInfo: BrokerInfo): void {
    if (Beans.get(IS_PLATFORM_HOST)) {
      return; // The host app client does not send a heartbeat.
    }
    interval(brokerInfo.heartbeatInterval)
      .pipe(takeUntil(this._platformStopping$))
      .subscribe(() => runSafe(() => {
        Beans.get(MessageClient).publish(PlatformTopics.heartbeat(brokerInfo.clientId)).then();
      }));
  }

  /**
   * Connects this client to the broker by sending a CONNECT message to the current and all parent windows.
   *
   * When the broker receives the CONNECT message and trusts this client, the broker responds with a CONNACK message,
   * or rejects the connect attempt otherwise.
   *
   * @return A Promise that, when connected, resolves to information about the broker, or that rejects if the connect attempt
   * failed, either because the broker could not be found or because the application is not allowed to connect.
   */
  private connectToBroker(): Promise<BrokerInfo> {
    const replyTo = UUID.randomUUID();
    const connectPromise = fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByTransport(MessagingTransport.BrokerToClient),
        filterByTopicChannel<ConnackMessage>(replyTo),
        mergeMap((messageEvent: MessageEvent<MessageEnvelope<TopicMessage<ConnackMessage>>>) => {
          const response: ConnackMessage | undefined = messageEvent.data.message.body;
          if (response?.returnCode !== 'accepted') {
            return throwError(`${response?.returnMessage ?? 'UNEXPECTED: Empty broker discovery response'} [code: '${response?.returnCode ?? 'n/a'}']`);
          }
          return of<BrokerInfo>({
            clientId: response.clientId!,
            heartbeatInterval: response.heartbeatInterval!,
            window: messageEvent.source as Window,
            origin: messageEvent.origin,
          });
        }),
        take(1),
        timeoutWith(new Date(Date.now() + this._brokerDiscoverTimeout), throwError(`[ClientConnectError] Message broker not discovered within the ${this._brokerDiscoverTimeout}ms timeout. Messages cannot be published or received.`)),
        tap({error: (error) => Beans.get(Logger, {orElseGet: NULL_LOGGER}).error(error)}), // Fall back using NULL_LOGGER, e.g., when the platform is stopping.
        takeUntil(this._platformStopping$),
      )
      .toPromise();

    const connectMessage: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: MessagingChannel.ClientConnect,
      message: {
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.Timestamp, Date.now())
          .set(MessageHeaders.AppSymbolicName, this._appSymbolicName)
          .set(MessageHeaders.ReplyTo, replyTo)
          .set(MessageHeaders.Version, Beans.get(VERSION)),
      },
    };

    this.collectWindowHierarchy().forEach(window => window.postMessage(connectMessage, '*'));
    return connectPromise;
  }

  /**
   * Disconnects this client from the broker by sending a DISCONNECT message.
   * Has no effect if not connected to the broker. If this operation fails, the error is logged as
   * a warning, but not thrown.
   */
  private disconnectFromBroker(): void {
    if (!this._brokerInfo) {
      return;
    }

    const disconnectMessage: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: MessagingChannel.ClientDisconnect,
      message: {
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.Timestamp, Date.now())
          .set(MessageHeaders.AppSymbolicName, this._appSymbolicName)
          .set(MessageHeaders.ClientId, this._brokerInfo.clientId),
      },
    };

    try {
      this._brokerInfo.window.postMessage(disconnectMessage, this._brokerInfo.origin);
      this._brokerInfo = null;
    }
    catch (error) {
      Beans.get(Logger, {orElseGet: NULL_LOGGER}).warn(`[ClientDisconnectError] Failed to disconnect from the broker. Caused by: ${error}`);
    }
  }

  /**
   * Returns an array of the current `Window` hierarchy.
   * Windows are sorted in top-down order, i.e., parent windows precede child windows.
   */
  private collectWindowHierarchy(): Window[] {
    const candidates: Window[] = [];

    for (let candidate = window as Window; candidate !== window.top; candidate = candidate.parent) {
      candidates.unshift(candidate);
    }

    candidates.unshift(window.top);
    return candidates;
  }

  /**
   * Method invoked when the platform enters state {@link PlatformState.Stopping}.
   *
   * Since this gateway is registered in the bean manager with the maximum destruction order `{destroyOrder: Number.MAX_SAFE_INTEGER}`,
   * the platform will destroy this bean after destroying other beans, which is important so that other beans can send messages
   * when the platform shuts down.
   */
  public preDestroy(): void {
    this._platformStopping$.next();
    this.disconnectFromBroker();
  }
}

/**
 * Replaces `Map` objects contained in the message with a `Map` object of the current JavaScript realm.
 *
 * Data sent from one JavaScript realm to another is serialized with the structured clone algorithm.
 * Although the algorithm supports the `Map` data type, a deserialized map object cannot be checked to be instance of `Map`.
 * This is most likely because the serialization takes place in a different realm.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * @see http://man.hubwiz.com/docset/JavaScript.docset/Contents/Resources/Documents/developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm.html
 * @internal
 */
function fixMapObjects<T extends Message>(): MonoTypeOperatorFunction<MessageEvent<MessageEnvelope<T>>> {
  return map((event: MessageEvent<MessageEnvelope<T>>): MessageEvent<MessageEnvelope<T>> => {
    const envelope: MessageEnvelope = event.data;
    envelope.message.headers = new Map(envelope.message.headers || []);

    if (envelope.channel === MessagingChannel.Intent) {
      const intentMessage = envelope.message as IntentMessage;
      intentMessage.intent.params = new Map(intentMessage.intent.params || []);
    }
    if (envelope.channel === MessagingChannel.Topic) {
      const topicMessage = envelope.message as TopicMessage;
      topicMessage.params = new Map(topicMessage.params || []);
    }
    return event;
  });
}

/**
 * Creates a string representation of the given {@link MessageEnvelope}.
 */
function stringifyEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope, (key, value) => (value instanceof Map) ? Dictionaries.coerce(value) : value);
}

function isPlatformStopped(): boolean {
  const platformState = Beans.opt(MicrofrontendPlatformRef);
  if (!platformState) {
    return true; // platform is destroyed
  }
  return platformState.state >= PlatformState.Stopped;
}

/**
 * Information about the broker.
 *
 * @ignore
 */
interface BrokerInfo {
  clientId: string;
  heartbeatInterval: number;
  origin: string;
  window: Window;
}
