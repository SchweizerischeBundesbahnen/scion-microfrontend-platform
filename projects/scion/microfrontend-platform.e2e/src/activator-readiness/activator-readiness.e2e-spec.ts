/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {consumeBrowserLog} from '../spec.util';
import {TestingAppPO} from '../testing-app.po';
import {logging} from 'protractor';
import {installSeleniumWebDriverClickFix} from '../selenium-webdriver-click-fix';
import Level = logging.Level;

/**
 * @see activator-readiness.module.ts
 * @see platform-initializer.service.ts
 */
describe('Activator Readiness', () => {

  installSeleniumWebDriverClickFix();

  it('should activate applications at platform startup and wait for them to finish activating, or continue if activation takes longer than the configured timeout (activatorLoadTimeout)', async () => {
    const testingAppPO = new TestingAppPO();
    // app-1-manifest-activator-readiness.json - has 2 activators with 1 readiness topic each
    // app-2-manifest-activator-readiness.json - has 1 activator with 1 readiness topic
    // app-3-manifest-activator-readiness.json - has 1 activator with 1 readiness topic, will exceed activatorLoadTimeout=800 in environment.ts
    // app-4-manifest-activator-readiness.json - has 1 activator with 1 readiness topic
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('manifestClassifier', 'activator-readiness')});

    await expect(await consumeBrowserLog(Level.ALL, /ActivatorLoadTimeoutError|PlatformInitializer::activator:onactivate/)).toEqual(jasmine.arrayContaining([
      '[sci] [ActivatorLoadTimeoutError] Timeout elapsed while waiting for application to signal readiness [app=app-3, timeout=800ms, readinessTopic=activator/ready]." "Timeout of 800ms elapsed.',
      '[PlatformInitializer::activator:onactivate] [app=app-1, pingReply=app-1 [primary: true, X-APP-NAME: app-1]]',
      '[PlatformInitializer::activator:onactivate] [app=app-1, pingReply=app-1 [primary: false, X-APP-NAME: app-1]]',
      '[PlatformInitializer::activator:onactivate] [app=app-2, pingReply=app-2 [primary: true, X-APP-NAME: app-2]]',
      '[PlatformInitializer::activator:onactivate] [app=app-4, pingReply=app-4 [primary: true, X-APP-NAME: app-4]]',
    ]));
  });
});
