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
import {toEqualIgnoreOrder} from './to-equal-ignore-order.matcher';
import {toMatchIntentMessage} from './to-match-intent-message.matcher';
import {toMatchTopicMessage} from './to-match-topic-message.matcher';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Tests the array to contain exactly the expected elements in any order.
       */
      toEqualIgnoreOrder(expected: Array<any>): Promise<R>;

      /**
       * Tests the message to match specified properties.
       */
      toMatchIntentMessage(expected: Partial<IntentMessage>): Promise<R>;

      /**
       * Tests the message to match specified properties.
       */
      toMatchTopicMessage(expected: Partial<TopicMessage>): Promise<R>;
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
      toEqualIgnoreOrder,
      toMatchIntentMessage,
      toMatchTopicMessage,
    });
  }
}
