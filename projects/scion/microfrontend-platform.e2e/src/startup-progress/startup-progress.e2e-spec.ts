/*
 * Copyright (c) 2018-2021 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { consumeBrowserLog } from '../spec.util';
import { TestingAppPO } from '../testing-app.po';
import { logging } from 'protractor';
import { installSeleniumWebDriverClickFix } from '../selenium-webdriver-click-fix';
import Level = logging.Level;

/**
 * @see activator-progress.module.ts
 * @see platform-initializer.service.ts
 */
describe('Startup Progress', () => {

  installSeleniumWebDriverClickFix();

  it('should report startup progress and complete if activators with readiness checks and timeout are present', async () => {
    const testingAppPO = new TestingAppPO();
    // app-1-manifest-activator-progress.json - has 2 activators with 1 readiness topic each
    // app-2-manifest-activator-progress.json - has 1 activator with 1 readiness topic
    // app-3-manifest-activator-progress.json - has 1 activator with 1 readiness topic, will exceed timeout (activatorLoadTimeout=800 in environment.ts)
    // app-4-manifest-activator-progress.json - has 1 activator with 0 readiness topic
    // devtools manifest.json with 0 activators are only configured for environment.ts and disabled for CI.
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('manifestClassifier', 'activator-progress')});

    if (await testingAppPO.isDevtoolsEnabled()) {
      await expect(await consumeBrowserLog(Level.DEBUG, /PlatformInitializer::host:progress/)).toEqual(jasmine.arrayWithExactContents([
        '[PlatformInitializer::host:progress] 0%',
        '[PlatformInitializer::host:progress] 5.56%',
        '[PlatformInitializer::host:progress] 11.11%',
        '[PlatformInitializer::host:progress] 16.67%',
        '[PlatformInitializer::host:progress] 22.22%',
        '[PlatformInitializer::host:progress] 27.78%',
        '[PlatformInitializer::host:progress] 33.33%',
        '[PlatformInitializer::host:progress] 47.22%',
        '[PlatformInitializer::host:progress] 61.11%',
        '[PlatformInitializer::host:progress] 75%',
        '[PlatformInitializer::host:progress] 88.89%',
        '[PlatformInitializer::host:progress] 100%',
        '[PlatformInitializer::host:progress] startup completed',
      ]));
    }
    else {
      await expect(await consumeBrowserLog(Level.DEBUG, /PlatformInitializer::host:progress/)).toEqual(jasmine.arrayWithExactContents([
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
      ]));
    }
  });

  it('should report startup progress and complete if no activators are present', async () => {
    const testingAppPO = new TestingAppPO();
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('activatorApiDisabled', true)});

    if (await testingAppPO.isDevtoolsEnabled()) {
      await expect(await consumeBrowserLog(Level.DEBUG, /PlatformInitializer::host:progress/)).toEqual(jasmine.arrayWithExactContents([
        '[PlatformInitializer::host:progress] 0%',
        '[PlatformInitializer::host:progress] 5.56%',
        '[PlatformInitializer::host:progress] 11.11%',
        '[PlatformInitializer::host:progress] 16.67%',
        '[PlatformInitializer::host:progress] 22.22%',
        '[PlatformInitializer::host:progress] 27.78%',
        '[PlatformInitializer::host:progress] 33.33%',
        '[PlatformInitializer::host:progress] 88.89%',
        '[PlatformInitializer::host:progress] 100%',
        '[PlatformInitializer::host:progress] startup completed',
      ]));
    }
    else {
      await expect(await consumeBrowserLog(Level.DEBUG, /PlatformInitializer::host:progress/)).toEqual(jasmine.arrayWithExactContents([
        '[PlatformInitializer::host:progress] 0%',
        '[PlatformInitializer::host:progress] 6.67%',
        '[PlatformInitializer::host:progress] 13.33%',
        '[PlatformInitializer::host:progress] 20%',
        '[PlatformInitializer::host:progress] 26.67%',
        '[PlatformInitializer::host:progress] 33.33%',
        '[PlatformInitializer::host:progress] 88.89%',
        '[PlatformInitializer::host:progress] 100%',
        '[PlatformInitializer::host:progress] startup completed',
      ]));
    }
  });
});
