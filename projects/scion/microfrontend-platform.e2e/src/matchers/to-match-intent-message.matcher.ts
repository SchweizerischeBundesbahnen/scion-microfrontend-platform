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
import {IntentMessage} from '@scion/microfrontend-platform';
import {expect} from '@playwright/test';

/**
 * Provides the implementation of {@link CustomMatchers#toMatchIntentMessage}.
 */
export async function toMatchIntentMessage(actual: MessageListItemPO | Promise<MessageListItemPO>, expected: Partial<IntentMessage>): Promise<MatcherReturnType> {
  const actualMessage = await actual;
  if (expected.intent?.type !== undefined) {
    await expect.poll(() => actualMessage.getIntentType(), 'unexpected type').toEqual(expected.intent.type);
  }
  if (expected.intent?.qualifier !== undefined) {
    await expect.poll(() => actualMessage.getIntentQualifier(), 'unexpected qualifier').toEqual(expected.intent.qualifier);
  }
  if (expected.body !== undefined) {
    await expect.poll(() => actualMessage.getBody(), 'unexpected body').toEqual(expected.body);
  }
  if (expected.capability !== undefined) {
    await expect.poll(() => actualMessage.getCapability(), 'unexpected capability').toEqual(expected.capability);
  }
  if (expected.headers !== undefined) {
    await expect.poll(() => actualMessage.getHeaders(), 'unexpected headers').toEqual(expect.objectContaining(Object.fromEntries(expected.headers)));
  }
  return {
    pass: true,
    message: () => 'passed',
  };
}
