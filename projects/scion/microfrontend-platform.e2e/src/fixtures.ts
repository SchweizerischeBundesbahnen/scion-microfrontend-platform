/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test as base} from '@playwright/test';
import {TestingAppPO} from './testing-app.po';
import {ConsoleLogs} from './console-logs';

/**
 * Provides the environment for each test.
 *
 * @see https://playwright.dev/docs/test-fixtures
 */
export type TestFixtures = {
  /**
   * Central PO to interact with the testing app.
   */
  testingAppPO: TestingAppPO;
  /**
   * Provides messages logged to the browser console.
   */
  consoleLogs: ConsoleLogs;
};

export const test = base.extend<TestFixtures>({
  testingAppPO: async ({page}, use) => {
    await use(new TestingAppPO(page));
  },
  consoleLogs: async ({page}, use) => {
    await use(new ConsoleLogs(page));
  },
});
