/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {expect} from '@playwright/test';
import {IntentMessage, TopicMessage} from '@scion/microfrontend-platform';
import {MessageListItemPO} from './messaging/message-list-item.po';
import {RouterOutletPagePO} from './router-outlet/router-outlet-page.po';
import {waitUntilStable} from './testing.util';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Tests the array to contain exactly the expected elements in any order.
       */
      toEqualIgnoreOrder(expected: Array<any>): R;

      /**
       * Tests the message to match specified properties.
       */
      toMatchIntentMessage(expected: Partial<IntentMessage>): R;

      /**
       * Tests the message to match specified properties.
       */
      toMatchTopicMessage(expected: Partial<TopicMessage>): R;

      /**
       * Tests the router outlet to display content of the given URL.
       */
      toHaveRouterOutletUrl(expected: string): R;
    }
  }
}

/**
 * SCION-specific matchers to be used as expectations.
 *
 * @see https://playwright.dev/docs/test-advanced#add-custom-matchers-using-expectextend
 */
export namespace CustomMatchers {

  /**
   * Installs SCION-specific matchers to be used as expectations.
   */
  export function install(): void {
    expect.extend({

      toEqualIgnoreOrder(actual: unknown, expected: Array<any>): ExpectationResult {
        if (Array.isArray(actual) && actual.length === expected.length && includeSameElements(actual, expected)) {
          return {pass: true};
        }
        return {
          pass: false,
          message: () => `Arrays not equal. Expected [${actual}] to equal [${expected}]`,
        };
      },

      async toMatchIntentMessage(actual: MessageListItemPO | Promise<MessageListItemPO>, expected: Partial<IntentMessage>): Promise<ExpectationResult> {
        const actualMessage = await actual;
        if (expected.intent?.type !== undefined) {
          await expect(await actualMessage.getIntentType(), 'unexpected type').toEqual(expected.intent.type);
        }
        if (expected.intent?.qualifier !== undefined) {
          await expect(await actualMessage.getIntentQualifier(), 'unexpected qualifier').toEqual(expected.intent.qualifier);
        }
        if (expected.body !== undefined) {
          await expect(await actualMessage.getBody(), 'unexpected body').toEqual(expected.body);
        }
        if (expected.capability !== undefined) {
          await expect(await actualMessage.getCapability(), 'unexpected capability').toEqual(expected.capability);
        }
        if (expected.headers !== undefined) {
          await expect(await actualMessage.getHeaders(), 'unexpected headers').toEqual(expect.objectContaining(Object.fromEntries(expected.headers)));
        }
        return {pass: true};
      },

      async toMatchTopicMessage(actual: MessageListItemPO | Promise<MessageListItemPO>, expected: Partial<TopicMessage>): Promise<ExpectationResult> {
        const actualMessage = await actual;
        if (expected.topic !== undefined) {
          await expect(await actualMessage.getTopic(), 'unexpected topic').toEqual(expected.topic);
        }
        if (expected.body !== undefined) {
          await expect(await actualMessage.getBody(), 'unexpected body').toEqual(expected.body);
        }
        if (expected.params !== undefined) {
          await expect(await actualMessage.getParams(), 'unexpected params').toEqual(Object.fromEntries(expected.params));
        }
        if (expected.headers !== undefined) {
          await expect(await actualMessage.getHeaders(), 'unexpected headers').toEqual(expect.objectContaining(Object.fromEntries(expected.headers)));
        }
        return {pass: true};
      },

      async toHaveRouterOutletUrl(routerOutletPO: RouterOutletPagePO, expected: string): Promise<ExpectationResult> {
        // It can take some time for the page to be loaded, therefore we have to wait for the URL to become stable.
        const url = await waitUntilStable(() => routerOutletPO.getEmbeddedContentUrl());
        if (url !== expected) {
          return {
            pass: false,
            message: () => `URLs not equal. Expected [${url}] to equal [${expected}]`,
          };
        }
        return {pass: true};
      },
    });
  }
}

function includeSameElements(array1: Array<any>, array2: Array<any>): boolean {
  return array1.every(item => array2.includes(item)) && array2.every(item => array1.includes(item));
}

interface ExpectationResult {
  pass: boolean;
  message?: () => string;
}
