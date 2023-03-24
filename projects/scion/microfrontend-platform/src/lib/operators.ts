/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MonoTypeOperatorFunction, OperatorFunction, pipe} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {MessageEnvelope, MessagingChannel, MessagingTransport} from './ɵmessaging.model';
import {IntentMessage, Message, TopicMessage} from './messaging.model';
import {TopicMatcher} from './topic-matcher.util';
import {Arrays} from '@scion/toolkit/util';

/**
 * TODO [MessageChannel]: I think we do not need this anymore.
 */
/** @internal */
export function filterByTransport(transport: MessagingTransport): OperatorFunction<MessageEvent, MessageEvent<MessageEnvelope>> {
  return filter((event: MessageEvent): event is MessageEvent<MessageEnvelope> => {
    const envelope: MessageEnvelope | undefined = event.data;
    return envelope?.transport === transport && !!envelope.channel && !!envelope.message?.headers;
  });
}

/**
 * TODO [MessageChannel]: I think we do not need this anymore.
 */
/** @internal */
export function filterByChannel<T extends Message>(...channel: MessagingChannel[]): OperatorFunction<MessageEvent<MessageEnvelope>, MessageEvent<MessageEnvelope<T>>> {
  const channels = new Set(Arrays.coerce(channel));
  return filter((event: MessageEvent<MessageEnvelope>): event is MessageEvent<MessageEnvelope<T>> => {
    return channels.has(event.data.channel);
  });
}

/**
 * TODO [MessageChannel]: I think we do not need this anymore.
 */
/** @internal */
export function filterByTopicChannel<T>(topic: string): OperatorFunction<MessageEvent<MessageEnvelope>, MessageEvent<MessageEnvelope<TopicMessage<T>>>> {
  return pipe(
    filterByChannel<TopicMessage<T>>(MessagingChannel.Topic),
    filter((event: MessageEvent<MessageEnvelope<TopicMessage<T>>>): boolean => {
      const messageTopic = event.data.message.topic;
      return !!messageTopic && new TopicMatcher(topic).match(messageTopic).matches;
    }),
  );
}

/** @internal */
export function pluckMessage<T extends Message>(): OperatorFunction<MessageEvent<MessageEnvelope<T>>, T> {
  return pipe(
    fixMapObjects(), // TODO [MessageChannel]: Is the the correct location to make this transformation?
    map((messageEvent: MessageEvent<MessageEnvelope<T>>): T => {
      return messageEvent.data.message;
    }));
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

