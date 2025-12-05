/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {defineConfig} from '@playwright/test';
import {CustomMatchers} from './src/matchers/custom-matchers';

const runInCI = !!process.env.CI;
const runHeadless = !!process.env.HEADLESS;

export default defineConfig({
  forbidOnly: runInCI,
  fullyParallel: true,
  webServer: [
    {
      command: runInCI ? 'npm run microfrontend-platform-testing-app:4201:dist-serve' : 'npm run microfrontend-platform-testing-app:4201:serve',
      port: 4201,
      reuseExistingServer: !runInCI,
    },
    {
      command: runInCI ? 'npm run microfrontend-platform-testing-app:4202:dist-serve' : 'npm run microfrontend-platform-testing-app:4202:serve',
      port: 4202,
      reuseExistingServer: !runInCI,
    },
    {
      command: runInCI ? 'npm run microfrontend-platform-testing-app:4203:dist-serve' : 'npm run microfrontend-platform-testing-app:4203:serve',
      port: 4203,
      reuseExistingServer: !runInCI,
    },
    {
      command: runInCI ? 'npm run microfrontend-platform-testing-app:4204:dist-serve' : 'npm run microfrontend-platform-testing-app:4204:serve',
      port: 4204,
      reuseExistingServer: !runInCI,
    },
  ],
  use: {
    browserName: 'chromium',
    headless: runHeadless,
    viewport: {width: 2048, height: 1536},
    baseURL: 'http://localhost:4201',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  testMatch: /.*\.e2e-spec\.ts/,
});

// Install SCION-specific matchers that can be used as expectations.
CustomMatchers.install();
