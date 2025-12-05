/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MatcherReturnType} from 'playwright/types/test';
import {MessageListItemPO} from '../messaging/message-list-item.po';
import {TopicMessage} from '@scion/microfrontend-platform';
import {expect} from '@playwright/test';

/**
 * Provides the implementation of {@link CustomMatchers#toMatchTopicMessage}.
 */
export async function toMatchTopicMessage(actual: MessageListItemPO | Promise<MessageListItemPO>, expected: Partial<TopicMessage>): Promise<MatcherReturnType> {
  const actualMessage = await actual;
  if (expected.topic !== undefined) {
    await expect.poll(() => actualMessage.getTopic(), 'unexpected topic').toEqual(expected.topic);
  }
  if (expected.body !== undefined) {
    await expect.poll(() => actualMessage.getBody(), 'unexpected body').toEqual(expected.body);
  }
  if (expected.params !== undefined) {
    await expect.poll(() => actualMessage.getParams(), 'unexpected params').toEqual(Object.fromEntries(expected.params));
  }
  if (expected.headers !== undefined) {
    await expect.poll(() => actualMessage.getHeaders(), 'unexpected headers').toEqual(expect.objectContaining(Object.fromEntries(expected.headers)));
  }
  return {
    pass: true,
    message: () => 'passed',
  };
}
