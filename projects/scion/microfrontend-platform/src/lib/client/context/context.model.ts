/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { MessageEnvelope, MessagingChannel, MessagingTransport } from '../../ɵmessaging.model';
import { UUID } from '@scion/toolkit/uuid';
import { MessageHeaders, TopicMessage } from '../../messaging.model';

/**
 * Context lookup options header to control if values should be collected.
 *
 * @ignore
 */
export const CONTEXT_LOOKUP_OPTIONS = 'ɵCONTEXT_LOOKUP_OPTIONS';

/**
 * Instructs how to look up context values.
 *
 * @category Context
 */
export interface ContextLookupOptions {
  /**
   * Controls whether to collect the most specific context value or to collect all values in the context
   * hierarchy that are associated with a context name. Defaults to `false` if not specified.
   *
   * If `true`, collects all values in the context hierarchy that are associated with the context name.
   * Collected values are returned as an array in context-descending order, i.e., values of parent contexts
   * come after values of child contexts.
   *
   * If `false`, the most specific context value is returned, i.e., the value of the closest context
   * that has a value associated with that name.
   */
  collect?: boolean;
}

/**
 * Provides the API to lookup context related information.
 *
 * @ignore
 */
export namespace Contexts {

  /**
   * Returns the request-reply topic to lookup the names of associated context values in the context tree.
   */
  export function contextTreeNamesLookupTopic(): string {
    return 'contexttree/names';
  }

  /**
   * Returns the request-reply topic to get notified when some context changes at any level in the context tree.
   */
  export function contextTreeChangeTopic(): string {
    return 'contexttree/change';
  }

  /**
   * Computes the request-reply topic to lookup a context value from embedded router outlet web content.
   */
  export function contextValueLookupTopic(name: string): string {
    return `context/${name}`;
  }

  /**
   * Creates a message envelope to request the context value associated with the given name.
   *
   * @param name - The name of the value to lookup.
   * @param replyTo - The 'replyTo' topic where to send the reply.
   * @param options - Options to control context lookup.
   * @param values - The collected values passed to the parent context during a context lookup.
   *                 Used to collect all values associated with the context name in the context hierarchy.
   */
  export function newContextValueLookupRequest(name: string, replyTo: string, options?: ContextLookupOptions, values?: any[]): MessageEnvelope<TopicMessage<any[]>> {
    return {
      transport: MessagingTransport.EmbeddedOutletContentToOutlet,
      channel: MessagingChannel.Topic,
      message: {
        topic: contextValueLookupTopic(encodeURIComponent(name)), // Encode in order to support names containing forward slashes or starting with a colon.
        body: values || [],
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.ReplyTo, replyTo)
          .set(CONTEXT_LOOKUP_OPTIONS, options),
      },
    };
  }

  /**
   * Creates a message envelope to lookup the names of associated context values in the context tree.
   *
   * @param replyTo - The 'replyTo' topic where to send the reply.
   * @param names - The names of the current context to be combined with the names of the parent contexts.
   */
  export function newContextTreeNamesLookupRequest(replyTo: string, names?: Set<string>): MessageEnvelope<TopicMessage<Set<string>>> {
    return {
      transport: MessagingTransport.EmbeddedOutletContentToOutlet,
      channel: MessagingChannel.Topic,
      message: {
        topic: Contexts.contextTreeNamesLookupTopic(),
        body: names || new Set<string>(),
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.ReplyTo, replyTo),
      },
    };
  }

  /**
   * Creates a message envelope to get notified when some context changes at any level in the context tree.
   *
   * @param replyTo - The 'replyTo' topic where to send the reply.
   */
  export function newContextTreeObserveRequest(replyTo: string): MessageEnvelope<TopicMessage<void>> {
    return {
      transport: MessagingTransport.EmbeddedOutletContentToOutlet,
      channel: MessagingChannel.Topic,
      message: {
        topic: Contexts.contextTreeChangeTopic(),
        headers: new Map()
          .set(MessageHeaders.MessageId, UUID.randomUUID())
          .set(MessageHeaders.ReplyTo, replyTo),
      },
    };
  }

  /**
   * Event emitted when a context value changed.
   */
  export interface ContextTreeChangeEvent {
    type: 'set' | 'remove';
    name: string;
    value?: any;
  }

  /**
   * Event emitted by the root context when subscribed to it.
   */
  export const RootContextSubscribeEvent = 'RootContextSubscribeEvent';
  export type RootContextSubscribeEventType = 'RootContextSubscribeEvent';
}
