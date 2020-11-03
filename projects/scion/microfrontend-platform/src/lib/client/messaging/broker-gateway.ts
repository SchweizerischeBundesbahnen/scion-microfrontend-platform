/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { EMPTY, from, fromEvent, merge, NEVER, noop, Observable, Observer, of, Subject, TeardownLogic, throwError } from 'rxjs';
import { MessageDeliveryStatus, MessageEnvelope, MessagingChannel, MessagingTransport, PlatformTopics, TopicSubscribeCommand, TopicUnsubscribeCommand } from '../../ɵmessaging.model';
import { finalize, first, map, mergeMap, share, switchMap, take, takeUntil, timeoutWith } from 'rxjs/operators';
import { filterByChannel, filterByHeader, filterByOrigin, filterByTopic, filterByTransport, pluckEnvelope, pluckMessage } from '../../operators';
import { UUID } from '@scion/toolkit/uuid';
import { IntentMessage, Message, MessageHeaders, TopicMessage } from '../../messaging.model';
import { GatewayInfoResponse, getGatewayJavaScript } from './broker-gateway-script';
import { Logger, NULL_LOGGER } from '../../logger';
import { Dictionaries } from '@scion/toolkit/util';
import { Beans, PreDestroy } from '@scion/toolkit/bean-manager';

/**
 * The gateway is responsible for dispatching messages between the client and the broker.
 *
 * The gateway is always between one client and the broker. Clients never connect to the broker or to each other directly.
 * The gateway operates on a dedicated {@link Window} instance. To initiate a connection, the gateway sends a CONNECT message
 * to the current and all its parent windows. When the broker receives a CONNECT message of a trusted client, the broker responds
 * with a CONNACK message and a status code. If no CONNACK message is received within some timeout, publishing messages is rejected
 * and no messages are received.
 *
 * When the gateway is disposed, it sends a DISCONNECT message to the broker.
 *
 * @ignore
 */
export abstract class BrokerGateway {

  /**
   * Returns whether this gateway is connected to the message broker.
   */
  public abstract isConnected(): Promise<boolean>;

  /**
   * Posts a message to the message broker. If not connected to the broker yet, waits posting the message
   * until established the connection to the broker.
   *
   * @return a Promise that resolves when successfully posted the message to the broker, or that rejects otherwise.
   */
  public abstract async postMessage(channel: MessagingChannel, message: Message): Promise<void>;

  /**
   * Posts a message to the message broker and receives replies.
   */
  public abstract requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>>;

  /**
   * Subscribes to messages published to the given topic.
   */
  public abstract subscribeToTopic<T>(topic: string): Observable<TopicMessage<T>>;

  /**
   * An Observable that emits when a message from the message broker is received.
   */
  public abstract get message$(): Observable<MessageEnvelope>;
}

/**
 * Broker gateway that does nothing.
 *
 * Use this gateway in tests to not connect to the platform host.
 *
 * @ignore
 */
export class NullBrokerGateway implements BrokerGateway {

  public constructor() {
    console.log('[NullBrokerGateway] Using \'NullBrokerGateway\'. Messages cannot be sent or received.');
  }

  public isConnected(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public get message$(): Observable<MessageEnvelope> {
    return NEVER;
  }

  public async postMessage(channel: MessagingChannel, message: Message): Promise<void> {
    return Promise.resolve();
  }

  public requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>> {
    return NEVER;
  }

  public subscribeToTopic<T>(topic: string): Observable<TopicMessage<T>> {
    return NEVER;
  }
}

/**
 * @ignore
 */
export class ɵBrokerGateway implements BrokerGateway, PreDestroy { // tslint:disable-line:class-name

  private _destroy$ = new Subject<void>();
  private _whenDestroy = this._destroy$.pipe(first()).toPromise();
  private _message$: Observable<MessageEnvelope>;
  private _whenGatewayInfo: Promise<GatewayInfo>;

  constructor(private _clientAppName: string, private _config: { discoveryTimeout: number, deliveryTimeout: number }) {
    // Get the JavaScript to discover the message broker and dispatch messages.
    const gatewayJavaScript = getGatewayJavaScript({clientAppName: this._clientAppName, clientOrigin: window.origin, discoverTimeout: this._config.discoveryTimeout});
    // Create a hidden iframe and load the gateway script.
    const whenGatewayWindow = this.mountIframeAndLoadScript(gatewayJavaScript);
    // Wait until receiving info about the gateway.
    this._whenGatewayInfo = whenGatewayWindow
      .then(gatewayWindow => this.requestGatewayInfo(gatewayWindow))
      .catch(error => {
        Beans.get(Logger, {orElseGet: NULL_LOGGER}).error(error); // Fall back using NULL_LOGGER when the platform is shutting down.
        throw error;
      });

    // Subscribe for broker messages sent to the gateway window.
    this._message$ = from(this._whenGatewayInfo.catch(() => NEVER_PROMISE)) // avoid uncaught promise error
      .pipe(
        switchMap(gateway => fromEvent<MessageEvent>(gateway.window, 'message').pipe(filterByOrigin(gateway.brokerOrigin))),
        filterByTransport(MessagingTransport.BrokerToClient),
        pluckEnvelope(),
        map((envelope: MessageEnvelope) => {
          envelope.message.headers = copyMap(envelope.message.headers);
          return envelope;
        }),
        takeUntil(this._destroy$), // no longer emit messages when destroyed
        share(),
      );
  }

  public isConnected(): Promise<boolean> {
    return this._whenGatewayInfo.then(() => true).catch(() => false);
  }

  public async postMessage(channel: MessagingChannel, message: Message): Promise<void> {
    const gateway = await this._whenGatewayInfo; // wait until connected to the broker
    const messageId = UUID.randomUUID();

    const envelope: MessageEnvelope = {
      transport: MessagingTransport.ClientToBroker,
      channel: channel,
      message: message,
    };
    envelope.message.headers.set(MessageHeaders.MessageId, messageId);
    addSenderHeadersToEnvelope(envelope, {clientAppName: this._clientAppName, clientId: gateway.clientId});

    // Create Promise waiting for the broker to accept and dispatch the message.
    const postError$ = new Subject<never>();
    const whenPosted = merge(this.message$, postError$)
      .pipe(
        filterByTopic<MessageDeliveryStatus>(messageId),
        first(),
        timeoutWith(new Date(Date.now() + this._config.deliveryTimeout), throwError(`[MessageDispatchError] Broker did not report message delivery state within the ${this._config.deliveryTimeout}ms timeout. [envelope=${stringifyEnvelope(envelope)}]`)),
        takeUntil(this._destroy$),
        mergeMap(statusMessage => statusMessage.body.ok ? EMPTY : throwError(statusMessage.body.details)),
      )
      .toPromise();

    try {
      gateway.window.postMessage(envelope, gateway.window.origin);
    }
    catch (error) {
      postError$.error(error);
    }

    await whenPosted;
  }

  public requestReply$<T = any>(channel: MessagingChannel, message: IntentMessage | TopicMessage): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      message.headers.set(MessageHeaders.ReplyTo, UUID.randomUUID());
      const unsubscribe$ = new Subject<void>();
      const postError$ = new Subject<void>();

      // Receive replies sent to the reply topic.
      this.subscribeToTopic<T>(message.headers.get(MessageHeaders.ReplyTo))
        .pipe(takeUntil(merge(this._destroy$, unsubscribe$, postError$)))
        .subscribe(next => observer.next(next), error => observer.error(error)); // dispatch next and error, but not complete

      // Post the message to the broker.
      this.postMessage(channel, message)
        .catch(error => {
          postError$.next();
          observer.error(error);
        });

      return (): void => unsubscribe$.next();
    });
  }

  public subscribeToTopic<T>(topic: string): Observable<TopicMessage<T>> {
    return new Observable((observer: Observer<TopicMessage>): TeardownLogic => {
      const unsubscribe$ = new Subject<void>();
      const subscriberId = UUID.randomUUID();

      // Receive messages sent to the given topic.
      this._message$
        .pipe(
          filterByChannel<TopicMessage>(MessagingChannel.Topic),
          pluckMessage(),
          filterByHeader({key: MessageHeaders.ɵTopicSubscriberId, value: subscriberId}),
          map(message => ({...message, headers: copyMap(message.headers), params: copyMap(message.params)})),
          takeUntil(merge(this._destroy$, unsubscribe$)),
          finalize(() => {
            const command: TopicUnsubscribeCommand = {subscriberId, headers: new Map()};
            this.postMessage(MessagingChannel.TopicUnsubscribe, command)
              // Do not propagate unsubscription errors, only log them, e.g. when the broker is not available. Fall back using NULL_LOGGER when the platform is shutting down
              .catch(error => Beans.get(Logger, {orElseGet: NULL_LOGGER}).warn(`[TopicUnsubscribeError] Failed to unsubscribe from topic '${topic}'. Caused by: ${error}`));
          }),
        )
        .subscribe(observer);

      // Subscribe for the messages sent to the given topic.
      const topicSubscribeMessage: TopicSubscribeCommand = {subscriberId, topic, headers: new Map()};
      this.postMessage(MessagingChannel.TopicSubscribe, topicSubscribeMessage)
        // Do not propagate subscription errors, only log them, e.g. when the broker is not available. Fall back using NULL_LOGGER when the platform is shutting down
        .catch(error => Beans.get(Logger, {orElseGet: NULL_LOGGER}).warn(`[TopicSubscribeError] Failed to subscribe to topic '${topic}'. Caused by: ${error}`));

      return (): void => unsubscribe$.next();
    });
  }

  public get message$(): Observable<MessageEnvelope> {
    return this._message$;
  }

  /**
   * Mounts a hidden iframe and loads the given JavaScript.
   *
   * @return A Promise that resolves to the content window of the iframe.
   */
  private mountIframeAndLoadScript(javaScript: string): Promise<Window> {
    const html = `<html><head><script>${javaScript}</script></head><body>Message Broker Gateway for '${this._clientAppName}'</body></html>`;
    const iframeUrl = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    const iframe = document.body.appendChild(document.createElement('iframe'));
    iframe.setAttribute('src', iframeUrl);

    // Take the iframe out of the document flow and hide it.
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.pointerEvents = 'none';

    // Add a destroy listener to unmount the iframe and revoke the object URL.
    this._whenDestroy.then(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(iframeUrl);
    });

    // Resolve to the content window of the iframe.
    return fromEvent(iframe, 'load')
      .pipe(
        map(() => iframe.contentWindow),
        take(1),
        takeUntil(this._destroy$),
      )
      .toPromise()
      .then(neverResolveIfUndefined);
  }

  /**
   * Sends a request to the gateway to query information about the gateway and the broker.
   *
   * @return A Promise that resolves to information about the gateway and the broker, or rejects
   *         if not receiving information within the configured timeout.
   */
  private requestGatewayInfo(gatewayWindow: Window): Promise<GatewayInfo> {
    const replyToTopic = UUID.randomUUID();
    const request: MessageEnvelope<TopicMessage> = {
      transport: MessagingTransport.ClientToGateway,
      channel: MessagingChannel.Topic,
      message: {
        topic: PlatformTopics.RequestGatewayInfo,
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.ReplyTo, replyToTopic),
      },
    };

    const whenReply: Promise<GatewayInfo> = fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByOrigin(gatewayWindow.origin),
        filterByTransport(MessagingTransport.GatewayToClient),
        pluckEnvelope(),
        filterByTopic<GatewayInfoResponse>(replyToTopic),
        mergeMap((reply: TopicMessage<GatewayInfoResponse>): Observable<GatewayInfo> => {
          const response: GatewayInfoResponse = reply.body;
          return response.ok ? of({clientId: response.clientId, window: gatewayWindow, brokerOrigin: response.brokerOrigin}) : throwError(response.error);
        }),
        take(1),
        timeoutWith(new Date(Date.now() + this._config.discoveryTimeout), throwError(`[BrokerDiscoverTimeoutError] Message broker not discovered within the ${this._config.discoveryTimeout}ms timeout. Messages cannot be published or received.`)),
        takeUntil(this._destroy$),
      )
      .toPromise();

    addSenderHeadersToEnvelope(request, {clientAppName: this._clientAppName});
    gatewayWindow.postMessage(request, gatewayWindow.origin);
    return whenReply.then(neverResolveIfUndefined);
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Information about the gateway and the broker.
 *
 * @ignore
 */
export interface GatewayInfo {
  window: Window;
  brokerOrigin: string;
  clientId: string;
}

/**
 * Adds headers to the message to identify the sending app.
 */
function addSenderHeadersToEnvelope(envelope: MessageEnvelope, sender: { clientAppName: string, clientId?: string }): void {
  const headers = envelope.message.headers;

  headers.set(MessageHeaders.Timestamp, Date.now());
  headers.set(MessageHeaders.AppSymbolicName, sender.clientAppName);
  sender.clientId && headers.set(MessageHeaders.ClientId, sender.clientId);
}

/**
 * Returns a Promise that never resolves if the given value is `undefined`.
 *
 * For instance, if creating a Promise from an Observable, the Promise resolves to `undefined`
 * if the Observable did not emit a value before its completion, e.g., on shutdown.
 *
 * @ignore
 */
function neverResolveIfUndefined<T>(value: T): Promise<T> {
  return value !== undefined ? Promise.resolve(value) : NEVER_PROMISE;
}

/**
 * Creates a string representation of the given {@link MessageEnvelope}.
 */
function stringifyEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope, (key, value) => (value instanceof Map) ? Dictionaries.coerce(value) : value);
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
 * @internal
 */
function copyMap<K, V>(data: Map<K, V>): Map<K, V> {
  return new Map(data);
}

/**
 * Promise which never resolves.
 *
 * @ignore
 */
const NEVER_PROMISE = new Promise<never>(noop);
