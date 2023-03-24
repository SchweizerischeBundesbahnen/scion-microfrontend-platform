/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {AsyncSubject, EMPTY, firstValueFrom, fromEvent, lastValueFrom, merge, NEVER, noop, Observable, Observer, of, ReplaySubject, Subject, TeardownLogic, throwError, timeout, timer} from 'rxjs';
import {ConnackMessage, MessageDeliveryStatus, MessageEnvelope, MessagingChannel, MessagingTransport, PlatformTopics, SubscribeCommand, UnsubscribeCommand} from '../../ɵmessaging.model';
import {finalize, mergeMap, take, takeUntil, tap} from 'rxjs/operators';
import {pluckMessage} from '../../operators';
import {UUID} from '@scion/toolkit/uuid';
import {IntentMessage, Message, MessageHeaders, ResponseStatusCodes, TopicMessage} from '../../messaging.model';
import {Logger, NULL_LOGGER} from '../../logger';
import {Dictionaries} from '@scion/toolkit/util';
import {Beans, Initializer, PreDestroy} from '@scion/toolkit/bean-manager';
import {APP_IDENTITY, IS_PLATFORM_HOST} from '../../platform.model';
import {ɵVERSION, ɵWINDOW_TOP} from '../../ɵplatform.model';
import {PlatformState} from '../../platform-state';
import {ConnectOptions} from '../connect-options';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {MessageClient} from './message-client';
import {runSafe} from '../../safe-runner';
import {stringifyError} from '../../error.util';
import {decorateObservable} from '../../observable-decorator';

/**
 * The gateway is responsible for dispatching messages between the client and the broker.
 *
 * To initiate a connection, the gateway sends a CONNECT message to the current and all parent windows. When the broker window
 * receives the CONNECT message, the broker responds with a CONNACK message. If no CONNACK message is received within the discovery
 * timeout, the gateway errors. When the gateway is being disposed, it sends a DISCONNECT message to the broker.
 *
 * @internal
 */
export abstract class BrokerGateway {

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
  public abstract postMessage(channel: MessagingChannel, message: Message, transfer?: Transferable[]): Promise<void>;

  /**
   * Posts a message to the message broker and receives replies. The Observable never completes.
   */
  public abstract requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>>;

  /**
   * Subscribes to described destination, unless the platform has been stopped at the time of subscription.
   */
  public abstract subscribe$<T extends Message>(subscriptionDescriptor: SubscriptionDescriptor): Observable<T>;
}

/**
 * Broker gateway that does nothing.
 *
 * Use this gateway in tests to not connect to the platform host.
 *
 * @internal
 */
export class NullBrokerGateway implements BrokerGateway {

  constructor() {
    console.log('[NullBrokerGateway] Using \'NullBrokerGateway\'. Messages cannot be sent or received.');
  }

  public isConnected(): Promise<boolean> {
    return Promise.resolve(true);
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

  public subscribe$<T extends Message>(subscriptionDescriptor: SubscriptionDescriptor): Observable<T> {
    return NEVER;
  }
}

/**
 * @internal
 */
export class ɵBrokerGateway implements BrokerGateway, PreDestroy, Initializer {

  /*
   * This Observable is primarily used as a notifier for the `takeUntil` operator to complete Observable subscriptions when the platform is shutting down.
   * Since some subscriptions trigger subsequent broker interactions, e.g., unsubscribing from a topic subscription, the notifier must "replay" its state
   * to avoid waiting for broker responses, which would never arrive and otherwise cause timeout errors.
   */
  private _platformStopping$ = new ReplaySubject<void>(1);
  private _appSymbolicName: string;
  private _brokerDiscoverTimeout: number;
  private _messageDeliveryTimeout: number;
  private _session: Session | null = null;
  private _session$ = new AsyncSubject<Session>();

  constructor(connectOptions?: ConnectOptions) {
    this._appSymbolicName = Beans.get<string>(APP_IDENTITY);
    this._brokerDiscoverTimeout = connectOptions?.brokerDiscoverTimeout ?? 10_000;
    this._messageDeliveryTimeout = connectOptions?.messageDeliveryTimeout ?? 10_000;
  }

  public async init(): Promise<void> {
    try {
      const session = await this.connectToBroker();
      this.installPingReplier(session);
      this._session = session;
      this._session$.next(session);
      this._session$.complete();
    }
    catch (error) {
      this._session$.error(error);
      throw error;
    }
  }

  public isConnected(): Promise<boolean> {
    return lastValueFrom(this._session$).then(() => true).catch(() => false);
  }

  public get session(): Session | null {
    return this._session;
  }

  public async postMessage(channel: MessagingChannel, message: Message, transfer?: Transferable[]): Promise<void> {
    if (isPlatformStopped()) {
      throw GatewayErrors.PLATFORM_STOPPED_ERROR;
    }

    // If not connected to the broker, wait until connected. If connected, continue execution immediately
    // without spawning a microtask. Otherwise, messages cannot be published during platform shutdown.
    const session = this._session || await lastValueFrom(this._session$);

    const envelope: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: channel,
      message: message,
    };
    envelope.message.headers
      .set(MessageHeaders.MessageId, UUID.randomUUID())
      .set(MessageHeaders.Timestamp, Date.now())
      .set(MessageHeaders.AppSymbolicName, this._appSymbolicName)
      .set(MessageHeaders.ClientId, session.clientId);

    const ackChannel = new MessageChannel();
    const brokerAckPort = ackChannel.port1;
    const clientAckPort = ackChannel.port2;
    clientAckPort.start();

    // TODO [MessageChannel]:
    // - first publish, then subscribe (open port after subscription)
    // - directly use payload instead of wrapping it in a TopicMessage

    // Install Promise that resolves once the broker has acknowledged the message, or that rejects otherwise.
    const postError$ = new Subject<never>();
    const whenPosted = new Promise<void>((resolve, reject) => {
      merge(fromEvent<MessageEvent<MessageEnvelope<TopicMessage<MessageDeliveryStatus>>>>(clientAckPort, 'message'), postError$)
        .pipe(
          take(1),
          pluckMessage(),
          timeout({first: this._messageDeliveryTimeout, with: () => throwError(() => GatewayErrors.MESSAGE_DISPATCH_ERROR(this._messageDeliveryTimeout, envelope))}),
          mergeMap(statusMessage => statusMessage.body!.ok ? EMPTY : throwError(() => Error(statusMessage.body!.details))),
          takeUntil(this._platformStopping$),
        )
        .subscribe({
          error: reject,
          complete: resolve,
        });
    });

    try {
      session.broker.port.postMessage(envelope, [brokerAckPort, ...(transfer ?? [])]);
    }
    catch (error) {
      postError$.error(error);
    }

    await whenPosted.finally(() => clientAckPort.close());
  }

  public requestReply$<T = any>(channel: MessagingChannel, request: IntentMessage | TopicMessage): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      if (isPlatformStopped()) {
        observer.error(GatewayErrors.PLATFORM_STOPPED_ERROR);
        return noop;
      }

      const replyTo = UUID.randomUUID();
      const subscriberId = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const requestError$ = new Subject<never>();

      const replyChannel = new MessageChannel();
      const brokerReplyPort = replyChannel.port1;
      const clientReplyPort = replyChannel.port2;
      clientReplyPort.start();

      request.headers
        .set(MessageHeaders.ReplyTo, replyTo) // message header for the replier where to send replies to
        .set(MessageHeaders.ɵSubscriberId, subscriberId); // message header to subscribe for replies

      // Receive replies sent to the reply topic.
      merge(fromEvent<MessageEvent<MessageEnvelope<TopicMessage>>>(clientReplyPort, 'message'), requestError$)
        .pipe(
          pluckMessage(),
          decorateObservable(),
          takeUntil(merge(this._platformStopping$, unsubscribe$)),
          finalize(() => {
            this.unsubscribe({unsubscribeChannel: MessagingChannel.TopicUnsubscribe, subscriberId, logContext: `[subscriberId=${subscriberId}, topic=${replyTo}]`})
            clientReplyPort.close();
          }),
        )
        .subscribe({
          next: reply => observer.next(reply),
          error: error => observer.error(error),
          complete: noop, // As per the API, the Observable never completes.
        });

      // Post the request to the broker.
      this.postMessage(channel, request, [brokerReplyPort])
        .catch(error => requestError$.error(error));

      return (): void => unsubscribe$.next();
    });
  }

  public subscribe$<T extends Message>(subscriptionDescriptor: SubscriptionDescriptor): Observable<T> {
    const {subscribeChannel, unsubscribeChannel, newSubscribeCommand} = subscriptionDescriptor;

    return new Observable((observer: Observer<T>): TeardownLogic => {
      if (isPlatformStopped()) {
        observer.error(GatewayErrors.PLATFORM_STOPPED_ERROR);
        return noop;
      }

      const subscriberId = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const subscribeError$ = new Subject<never>();

      const subscribeMessageChannel = new MessageChannel();
      const brokerSubscribePort = subscribeMessageChannel.port1;
      const clientSubscribePort = subscribeMessageChannel.port2;
      clientSubscribePort.start();

      // Receive messages of given subscription.
      merge(fromEvent<MessageEvent<MessageEnvelope<T>>>(clientSubscribePort, 'message'), subscribeError$)
        .pipe(
          pluckMessage(),
          decorateObservable(),
          takeUntil(merge(this._platformStopping$, unsubscribe$)),
          finalize(() => {
            this.unsubscribe({unsubscribeChannel, subscriberId, logContext: JSON.stringify(newSubscribeCommand(subscriberId))})
            clientSubscribePort.close();
          }),
        )
        .subscribe({
          next: message => observer.next(message),
          error: error => observer.error(error),
          complete: noop, // As per the API, the Observable never completes.
        });

      // Post the subscription to the broker.
      this.postMessage(subscribeChannel, newSubscribeCommand(subscriberId), [brokerSubscribePort])
        .catch(error => subscribeError$.error(error));

      return (): void => unsubscribe$.next();
    });
  }

  /**
   * Unsubscribes from described destination. Does nothing if the platform is stopped.
   */
  private async unsubscribe(descriptor: {unsubscribeChannel: MessagingChannel; subscriberId: string; logContext: string}): Promise<void> {
    if (isPlatformStopped()) {
      return;
    }

    const {unsubscribeChannel, subscriberId, logContext} = descriptor;
    const unsubscribeCommand: UnsubscribeCommand = {subscriberId, headers: new Map()};
    try {
      await this.postMessage(unsubscribeChannel, unsubscribeCommand);
    }
    catch (error) {
      Beans.get(Logger, {orElseGet: NULL_LOGGER}).error(`[UnsubscribeError] Failed to unsubscribe from destination: '${logContext}'. Caused by: ${error}`);  // Fall back using NULL_LOGGER, e.g., when the platform is stopping.
    }
  }

  /**
   * Installs a ping replier to indicate that this client is connected to the host.
   *
   * Note that no ping replier is installed if running in the context of the host application.
   */
  private installPingReplier(session: Session): void {
    if (Beans.get(IS_PLATFORM_HOST)) {
      return; // The host app client does not reply to pings.
    }

    Beans.get(MessageClient).observe$(PlatformTopics.ping(session.clientId))
      .pipe(takeUntil(this._platformStopping$))
      .subscribe(request => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)}).then();
      }));
  }

  /**
   * Connects this client to the broker by sending a CONNECT message to the current and all parent windows.
   *
   * When the broker receives the CONNECT message and trusts this client, the broker responds with a CONNACK message,
   * or rejects the connect attempt otherwise.
   *
   * @return A Promise that, when connected, resolves to information about the connected client and broker, or that rejects if the connect attempt
   * failed, either because the broker could not be found or because the application is not allowed to connect.
   */
  public connectToBroker(): Promise<Session> {
    const connectRequests$ = new Array<Observable<Session>>();
    const done$ = new Subject<void>();
    if (Beans.get(IS_PLATFORM_HOST)) {
      connectRequests$.push(this.connectToBrokerCandidate$(window, window.origin));
    }
    else if (window === Beans.get(ɵWINDOW_TOP)) {
      // If loading the client into the topmost window it may be integrated into a rich client, with the host running in a different browser window (remote host).
      // The rich client then bridges messages between the windows of the client and the remote host. Since the rich client may not be able to bridge messages
      // right away when the client loads, the client repeatedly sends a connect request until acknowledged by the remote host.
      const windowHierarchy = this.collectWindowHierarchy();
      timer(0, 25)
        .pipe(takeUntil(done$))
        .subscribe(() => {
          windowHierarchy.forEach(window => connectRequests$.push(this.connectToBrokerCandidate$(window)));
        });
    }
    else {
      this.collectWindowHierarchy().forEach(window => connectRequests$.push(this.connectToBrokerCandidate$(window)));
    }

    return firstValueFrom(merge(...connectRequests$)
      .pipe(
        timeout({first: this._brokerDiscoverTimeout, with: () => throwError(() => GatewayErrors.BROKER_DISCOVER_ERROR(this._brokerDiscoverTimeout))}),
        tap({error: error => Beans.get(Logger, {orElseGet: NULL_LOGGER}).error(stringifyError(error))}), // Fall back using NULL_LOGGER, e.g., when the platform is stopping.
        takeUntil(this._platformStopping$),
        finalize(() => done$.next()),
      ));
  }

  private connectToBrokerCandidate$(target: Window, origin?: string): Observable<Session> {
    const channel = new MessageChannel();
    const brokerPort = channel.port1;
    const clientPort = channel.port2;

    const connectMessage: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: MessagingChannel.ClientConnect,
      message: {
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.Timestamp, Date.now())
          .set(MessageHeaders.AppSymbolicName, this._appSymbolicName)
          .set(MessageHeaders.Version, Beans.get(ɵVERSION)),
      },
    };
    target.postMessage(connectMessage, origin ?? '*', [brokerPort]);

    const unsubscribe$ = new Subject<void>();
    return new Observable<Session>(observer => {
      fromEvent<MessageEvent<ConnackMessage>>(clientPort, 'message')
        .pipe(
          mergeMap((messageEvent: MessageEvent<ConnackMessage>) => {
            const response: ConnackMessage | undefined = messageEvent.data;
            if (response?.returnCode !== 'accepted') {
              return throwError(() => Error(`${response?.returnMessage ?? 'UNEXPECTED: Empty broker discovery response'} [code: '${response?.returnCode ?? 'n/a'}']`));
            }
            return of<Session>({
              clientId: response.clientId!,
              broker: {
                window: messageEvent.source as Window,
                origin: messageEvent.origin,
                port: clientPort,
              },
            });
          }),
          takeUntil(unsubscribe$),
        )
        .subscribe(observer);

      clientPort.start();
      return () => unsubscribe$.next();
    });
  }

  /**
   * Disconnects this client from the broker by sending a DISCONNECT message.
   * Has no effect if not connected to the broker. If this operation fails, the error is logged as
   * a warning, but not thrown.
   */
  private disconnectFromBroker(): void {
    if (!this._session) {
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
          .set(MessageHeaders.ClientId, this._session.clientId),
      },
    };

    try {
      this._session.broker.port.postMessage(disconnectMessage);
      this._session.broker.port.close();
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

    for (let candidate = window as Window; candidate !== Beans.get(ɵWINDOW_TOP); candidate = candidate.parent) {
      candidates.unshift(candidate);
    }

    candidates.unshift(Beans.get<Window>(ɵWINDOW_TOP));
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
    this.disconnectFromBroker();
    this._platformStopping$.next();
  }
}

/**
 * Creates a string representation of the given {@link MessageEnvelope}.
 */
function stringifyEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope, (key, value) => (value instanceof Map) ? Dictionaries.coerce(value) : value);
}

function isPlatformStopped(): boolean {
  return MicrofrontendPlatform.state >= PlatformState.Stopped;
}

/**
 * Session created after successful connection with the broker.
 */
interface Session {
  clientId: string;
  broker: {
    // TODO [MessageChannel]: I think we need this for backward compatiblity.
    // @deprecated since version 1.0.0-rc.14; Legacy support will be removed in version 2.0.0.
    origin: string;
    // TODO [MessageChannel]: I think we need this for backward compatiblity.
    // @deprecated since version 1.0.0-rc.14; Legacy support will be removed in version 2.0.0.
    window: Window;
    // TODO [MessageChannel]: I think, this should only be the connect port and must not be stored on the session
    port: MessagePort;
  };
}

namespace GatewayErrors {

  export const PLATFORM_STOPPED_ERROR = Error('[GatewayError] Platform is stopped. Messages cannot be published or received.');

  export function MESSAGE_DISPATCH_ERROR(timeout: number, message: MessageEnvelope): Error {
    return Error(`[GatewayError] No acknowledgement received within ${timeout}ms for a message sent to the broker. [msg=${stringifyEnvelope(message)}]`);
  }

  export function BROKER_DISCOVER_ERROR(timeout: number): Error {
    return Error(`[GatewayError] Message broker not discovered within ${timeout}ms. Messages cannot be published or received.`);
  }
}

/**
 * Describes how to subscribe for messages.
 *
 * @internal
 */
export interface SubscriptionDescriptor {
  /**
   * Channel for receiving subscribed messages.
   *
   * TODO [MessageChannel]: I think we do not need this anymore.
   */
  messageChannel: MessagingChannel;
  /**
   * Channel to send the subscribe request.
   *
   * TODO [MessageChannel]: I think we do not need this anymore.
   */
  subscribeChannel: MessagingChannel;
  /**
   * Channel to send the unsubscribe request.
   *
   * TODO [MessageChannel]: I think we do not need this anymore.
   */
  unsubscribeChannel: MessagingChannel;
  /**
   * Callback that is invoked to create the subscription command that will be sent over the subscription channel.
   */
  newSubscribeCommand: (subscriberId: string) => SubscribeCommand;
}
