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

/**
 * Declares the message transports.
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
   * Channel to publish and dispatch topic-related messages.
   */
  Topic = 'topic',
  /**
   * Channel to publish and dispatch intents.
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
 */
export interface MessageEnvelope<MSG extends Message = Message> {
  transport: MessagingTransport;
  channel: MessagingChannel;
  message: MSG;
}

/**
 * Declares internal platform topics.
 */
export enum PlatformTopics {
  /**
   * Allows requesting the subscription count on a topic.
   */
  RequestSubscriberCount = 'ɵREQUEST_SUBSCRIBER_COUNT',
  /**
   * When a client gains the focus it publishes a retained event to this topic.
   */
  FocusIn = 'ɵFOCUS_IN',
  /**
   * Allows testing whether the requester has received focus or contains embedded web content that has received focus.
   */
  IsFocusWithin = 'ɵIS_FOCUS_WITHIN',
  /**
   * Allows reading the platform properties from this retained topic.
   */
  PlatformProperties = 'ɵPLATFORM_PROPERTIES',
  /**
   * Allows reading the registered applications from this retained topic.
   */
  Applications = 'ɵAPPLICATIONS',
}

/**
 * Sent by the broker in response to a connect request from a client gateway.
 */
export interface ConnackMessage {
  returnCode: 'accepted' | 'refused:bad-request' | 'refused:rejected' | 'refused:blocked';
  returnMessage?: string;
  /**
   * Unique id assigned to the client by the broker. Is only set on success.
   */
  clientId?: string;
}

export interface TopicSubscribeCommand extends Message {
  /**
   * Unique identify of the subscriber.
   */
  subscriberId: string;
  /**
   * Topic to which to subscribe.
   */
  topic: string;
}

export interface TopicUnsubscribeCommand extends Message {
  /**
   * Unique identify of the subscriber.
   */
  subscriberId: string;
}

export interface MessageDeliveryStatus {
  ok: boolean;
  details?: string;
}
