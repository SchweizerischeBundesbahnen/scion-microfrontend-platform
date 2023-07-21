/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Message} from './messaging.model';
import {IntentSelector} from './client/messaging/intent-client';

/**
 * Declares the message transports.
 *
 * @internal
 */
export enum MessagingTransport {
  /**
   * Transport used by clients to communicate with the broker.
   */
  ClientToBroker = 'sci://microfrontend-platform/client-to-broker',
  /**
   * Transport used by the broker to communicate with its clients.
   */
  BrokerToClient = 'sci://microfrontend-platform/broker-to-client',
  /**
   * Transport used by a microfrontend to communicate with its embedding outlet.
   */
  MicrofrontendToOutlet = 'sci://microfrontend-platform/microfrontend-to-outlet',
}

/**
 * Defines the channels to which messages can be sent.
 *
 * @internal
 */
export enum MessagingChannel {
  /**
   * Channel for clients to subscribe to a topic destination.
   */
  TopicSubscribe = 'topic-subscribe',
  /**
   * Channel for clients to unsubscribe from a topic destination.
   */
  TopicUnsubscribe = 'topic-unsubscribe',
  /**
   * Channel for clients to subscribe to intents.
   */
  IntentSubscribe = 'intent-subscribe',
  /**
   * Channel for clients to unsubscribe from intents.
   */
  IntentUnsubscribe = 'intent-unsubscribe',
  /**
   * Channel for the host to transport topic message to subscribed clients.
   */
  Topic = 'topic',
  /**
   * Channel for the host to transport intent messages to subscribed clients.
   */
  Intent = 'intent',
  /**
   * Channel for clients to send a connect request.
   */
  ClientConnect = 'client-connect',
  /**
   * Channel for clients to send a disconnect request.
   */
  ClientDisconnect = 'client-disconnect'
}

/**
 * Envelope for all messages.
 *
 * @internal
 */
export interface MessageEnvelope<MSG extends Message = Message> {
  transport: MessagingTransport;
  channel: MessagingChannel;
  message: MSG;
}

/**
 * Declares internal platform topics.
 *
 * @internal
 */
export namespace PlatformTopics {
  /**
   * Topic to request the subscription count on a topic.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link string}
   * Response Type: {@link number}
   */
  export const RequestSubscriberCount = 'ɵREQUEST_SUBSCRIBER_COUNT';
  /**
   * Topic to signal when gained the focus.
   *
   * Messaging Pattern: Publish-Subscribe
   * Payload: {@link void}
   */
  export const FocusIn = 'ɵFOCUS_IN';
  /**
   * Topic to request whether the requesting client (or a microfrontend embedded in the client) has gained focus.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link void}
   * Response Type: {@link boolean}
   */
  export const IsFocusWithin = 'ɵIS_FOCUS_WITHIN';
  /**
   * Topic to request whether the requesting client has gained focus.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link void}
   * Response Type: {@link boolean}
   */
  export const HasFocus = 'ɵHAS_FOCUS';
  /**
   * Topic to read platform properties.
   *
   * Messaging Pattern: Publish-Subscribe
   * Payload: {@link Record}
   */
  export const PlatformProperties = 'ɵPLATFORM_PROPERTIES';
  /**
   * Topic to read platform registered applications.
   *
   * Messaging Pattern: Publish-Subscribe
   * Payload: {@link ɵApplication}
   */
  export const Applications = 'ɵAPPLICATIONS';
  /**
   * Topic to request capabilities.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link ManifestObjectFilter}
   * Response Type: {@link Array<Capability>}
   */
  export const LookupCapabilities = 'ɵLOOKUP_CAPABILITIES';
  /**
   * Topic to request intentions.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link ManifestObjectFilter}
   * Response Type: {@link Array<Intention>}
   */
  export const LookupIntentions = 'ɵLOOKUP_INTENTIONS';
  /**
   * Topic to register a capability.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link Capability}
   * Response Type: {@link string}
   */
  export const RegisterCapability = 'ɵREGISTER_CAPABILITY';
  /**
   * Topic to unregister a capability.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link ManifestObjectFilter}
   * Response Type: {@link void}
   */
  export const UnregisterCapabilities = 'ɵUNREGISTER_CAPABILITIES';
  /**
   * Topic to register an intentions.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link Intention}
   * Response Type: {@link string}
   */
  export const RegisterIntention = 'ɵREGISTER_INTENTION';
  /**
   * Topic to unregister an intention.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link ManifestObjectFilter}
   * Response Type: {@link void}
   */
  export const UnregisterIntentions = 'ɵUNREGISTER_INTENTIONS';
  /**
   * Topic to check if application is qualified for the capability.
   *
   * Messaging Pattern: Request-Response
   * Request Type: {@link ApplicationQualifiedForCapabilityRequest}
   * Response Type: {@link boolean}
   */
  export const IsApplicationQualifiedForCapability = 'ɵIS_APPLICATION_QUALIFIED_FOR_CAPABILITY';

  /**
   * Topic to request the platform version of a specific application.
   */
  export function platformVersion(appSymbolicName: string): string {
    return `ɵapplication/${appSymbolicName}/platform/version`;
  }

  /**
   * Topic to ping a client for liveness.
   */
  export function ping(clientId: string): string {
    return `ɵclient/${clientId}/ping`;
  }
}

/**
 * Sent by the broker in response to a connect request from a client gateway.
 *
 * @internal
 */
export interface ConnackMessage {
  returnCode: 'accepted' | 'refused:bad-request' | 'refused:rejected' | 'refused:blocked';
  returnMessage?: string;
  /**
   * Unique id assigned to the client by the broker. Is only set on success.
   */
  clientId?: string;
}

/**
 * @internal
 */
export interface SubscribeCommand extends Message {
  /**
   * Unique identify of the subscriber.
   */
  subscriberId: string;
}

/**
 * @internal
 */
export interface TopicSubscribeCommand extends SubscribeCommand {
  /**
   * Topic to subscribe.
   */
  topic: string;
}

/**
 * @internal
 */
export interface IntentSubscribeCommand extends SubscribeCommand {
  /**
   * Selects intents that match the specified selector and for which the application provides a fulfilling capability.
   */
  selector?: IntentSelector;
}

/**
 * @internal
 */
export interface UnsubscribeCommand extends Message {
  /**
   * Unique identify of the subscriber.
   */
  subscriberId: string;
}

/**
 * @internal
 */
export interface MessageDeliveryStatus {
  ok: boolean;
  details?: string;
}
