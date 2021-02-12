/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { consumeBrowserLog, seleniumWebDriverClickFix, SeleniumWebDriverClickFix } from '../spec.util';
import { TestingAppPO } from '../testing-app.po';
import { logging } from 'protractor';
import Level = logging.Level;

describe('Activator', () => {

  let fix: SeleniumWebDriverClickFix;
  beforeAll(() => fix = seleniumWebDriverClickFix().install());
  afterAll(() => fix.uninstall());

  it('should activate applications on platform startup', async () => {
    const testingAppPO = new TestingAppPO();
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('manifestClassifier', 'activator')});

    await expect(await consumeBrowserLog(Level.DEBUG, /PlatformInitializer::activator:onactivate/)).toEqual(jasmine.arrayWithExactContents([
      `[PlatformInitializer::activator:onactivate] [app=app-1, pingReply=app-1 [primary: true, X-APP-NAME: app-1]]`,
      `[PlatformInitializer::activator:onactivate] [app=app-1, pingReply=app-1 [primary: false, X-APP-NAME: app-1]]`,
      `[PlatformInitializer::activator:onactivate] [app=app-2, pingReply=app-2 [primary: true, X-APP-NAME: app-2]]`,
      `[PlatformInitializer::activator:onactivate] [app=app-3, pingReply=app-3 [primary: true, X-APP-NAME: app-3]]`,
      `[PlatformInitializer::activator:onactivate] [app=app-4, pingReply=app-4 [primary: true, X-APP-NAME: app-4]]`,
    ]));
  }, 20000); // Increase the timeout as activators signal readiness in the range from 0 to 10s.
});
