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
import {Message, TopicMessage} from './messaging.model';
import {TopicMatcher} from './topic-matcher.util';
import {Arrays} from '@scion/toolkit/util';

/** @internal */
export function filterByTransport(transport: MessagingTransport): OperatorFunction<MessageEvent, MessageEvent<MessageEnvelope>> {
  return filter((event: MessageEvent): event is MessageEvent<MessageEnvelope> => {
    const envelope = event.data as MessageEnvelope | undefined;
    return envelope?.transport === transport;
  });
}

/** @internal */
export function filterByChannel<T extends Message>(...channel: MessagingChannel[]): OperatorFunction<MessageEvent<MessageEnvelope>, MessageEvent<MessageEnvelope<T>>> {
  const channels = new Set(Arrays.coerce(channel));
  return filter((event: MessageEvent<MessageEnvelope>): event is MessageEvent<MessageEnvelope<T>> => {
    return channels.has(event.data.channel);
  });
}

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
export function filterByOrigin(origin: string): MonoTypeOperatorFunction<MessageEvent> {
  return filter((event: MessageEvent): boolean => {
    return event.origin === origin;
  });
}

/** @internal */
export function filterByWindow(window: Window): MonoTypeOperatorFunction<MessageEvent> {
  return filter((event: MessageEvent): boolean => {
    return event.source === window;
  });
}

/** @internal */
export function pluckMessage<T extends Message>(): OperatorFunction<MessageEvent<MessageEnvelope<T>>, T> {
  return map((messageEvent: MessageEvent<MessageEnvelope<T>>): T => {
    return messageEvent.data.message;
  });
}
