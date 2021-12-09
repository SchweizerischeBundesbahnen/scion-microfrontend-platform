/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {identity, MonoTypeOperatorFunction, OperatorFunction, pipe, throwError} from 'rxjs';
import {filter, map, timeoutWith} from 'rxjs/operators';
import {MessageEnvelope, MessagingChannel, MessagingTransport} from './ɵmessaging.model';
import {Message, TopicMessage} from './messaging.model';
import {TopicMatcher} from './topic-matcher.util';
import {Arrays} from '@scion/toolkit/util';

/** @ignore */
export function filterByTransport(transport: MessagingTransport): OperatorFunction<MessageEvent, MessageEvent<MessageEnvelope>> {
  return filter((event: MessageEvent): event is MessageEvent<MessageEnvelope> => {
    const envelope: MessageEnvelope | undefined = event.data;
    return envelope?.transport === transport && !!envelope.channel && !!envelope.message?.headers;
  });
}

/** @ignore */
export function filterByChannel<T extends Message>(...channel: MessagingChannel[]): OperatorFunction<MessageEvent<MessageEnvelope>, MessageEvent<MessageEnvelope<T>>> {
  const channels = new Set(Arrays.coerce(channel));
  return filter((event: MessageEvent<MessageEnvelope>): event is MessageEvent<MessageEnvelope<T>> => {
    return channels.has(event.data.channel);
  });
}

/** @ignore */
export function filterByTopicChannel<T>(topic: string): OperatorFunction<MessageEvent<MessageEnvelope>, MessageEvent<MessageEnvelope<TopicMessage<T>>>> {
  return pipe(
    filterByChannel<TopicMessage<T>>(MessagingChannel.Topic),
    filter((event: MessageEvent<MessageEnvelope<TopicMessage<T>>>): boolean => {
      const messageTopic = event.data.message.topic;
      return !!messageTopic && new TopicMatcher(topic).match(messageTopic).matches;
    }),
  );
}

/** @ignore */
export function filterByOrigin(origin: string): MonoTypeOperatorFunction<MessageEvent> {
  return filter((event: MessageEvent): boolean => {
    return event.origin === origin;
  });
}

/** @ignore */
export function filterByMessageHeader<T extends Message>(header: {key: string; value: any}): MonoTypeOperatorFunction<MessageEvent<MessageEnvelope<T>>> {
  return filter((event: MessageEvent<MessageEnvelope<T>>): boolean => {
    const messageHeaders = event.data.message.headers;
    return messageHeaders.has(header.key) && messageHeaders.get(header.key) === header.value;
  });
}

/** @ignore */
export function pluckMessage<T extends Message>(): OperatorFunction<MessageEvent<MessageEnvelope<T>>, T> {
  return map((messageEvent: MessageEvent<MessageEnvelope<T>>): T => {
    return messageEvent.data.message;
  });
}

/**
 * Like RxJS {@link timeoutWith}, but without effect if passing a `0` or `undefined` timeout.
 *
 * Throws an error if passing a negative timeout.
 *
 * @ignore
 */
export function timeoutIfPresent<T>(timeout: number | undefined): MonoTypeOperatorFunction<T> {
  if (timeout && timeout < 0) {
    throw Error(`[IllegalTimeoutError] Negative timeouts not supported [timeout=${timeout}]`);
  }

  if (timeout) {
    return timeoutWith(new Date(Date.now() + timeout), throwError(`Timeout of ${timeout}ms elapsed.`));
  }
  return identity;
}
