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
import {test} from '../fixtures';

/**
 * @see activator-progress.module.ts
 * @see platform-initializer.service.ts
 */
test.describe('Startup Progress', () => {

  test('should report startup progress and complete if activators with readiness checks and timeout are present', async ({testingAppPO, consoleLogs}) => {
    // app-1-manifest-activator-progress.json - has 2 activators with 1 readiness topic each
    // app-2-manifest-activator-progress.json - has 1 activator with 1 readiness topic
    // app-3-manifest-activator-progress.json - has 1 activator with 1 readiness topic, will exceed timeout (activatorLoadTimeout=800 in environment.ts)
    // app-4-manifest-activator-progress.json - has 1 activator with 0 readiness topic
    // devtools manifest.json with 0 activators are only configured for environment.ts and disabled for CI.
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('manifestClassifier', 'activator-progress')});

    await expect(await consoleLogs.get({severity: 'debug', filter: /PlatformInitializer::host:progress/})).toEqualIgnoreOrder([
      '[PlatformInitializer::host:progress] 0%',
      '[PlatformInitializer::host:progress] 6.67%',
      '[PlatformInitializer::host:progress] 13.33%',
      '[PlatformInitializer::host:progress] 20%',
      '[PlatformInitializer::host:progress] 26.67%',
      '[PlatformInitializer::host:progress] 33.33%',
      '[PlatformInitializer::host:progress] 47.22%',
      '[PlatformInitializer::host:progress] 61.11%',
      '[PlatformInitializer::host:progress] 75%',
      '[PlatformInitializer::host:progress] 88.89%',
      '[PlatformInitializer::host:progress] 100%',
      '[PlatformInitializer::host:progress] startup completed',
    ]);
  });

  test('should report startup progress and complete if no activators are present', async ({testingAppPO, consoleLogs}) => {
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('activatorApiDisabled', true)});

    await expect(await consoleLogs.get({severity: 'debug', filter: /PlatformInitializer::host:progress/})).toEqualIgnoreOrder([
      '[PlatformInitializer::host:progress] 0%',
      '[PlatformInitializer::host:progress] 6.67%',
      '[PlatformInitializer::host:progress] 13.33%',
      '[PlatformInitializer::host:progress] 20%',
      '[PlatformInitializer::host:progress] 26.67%',
      '[PlatformInitializer::host:progress] 33.33%',
      '[PlatformInitializer::host:progress] 88.89%',
      '[PlatformInitializer::host:progress] 100%',
      '[PlatformInitializer::host:progress] startup completed',
    ]);
  });
});
