/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { seleniumWebDriverClickFix, SeleniumWebDriverClickFix } from '../spec.util';
import { TestingAppPO } from '../testing-app.po';

describe('Activator', () => {

  let fix: SeleniumWebDriverClickFix;
  beforeAll(() => fix = seleniumWebDriverClickFix().install());
  afterAll(() => fix.uninstall());

  it('should activate applications on platform startup', async () => {
    const testingAppPO = new TestingAppPO();
    await testingAppPO.navigateTo({}, {queryParams: new Map().set('manifestClassifier', 'activator')});

    const consolePanelPO = testingAppPO.consolePanelPO();
    await consolePanelPO.open();

    await expect(consolePanelPO.getLog(['onActivate'])).toEqual(jasmine.arrayWithExactContents([
        jasmine.objectContaining({type: 'onActivate', message: 'app-1 - app-1 [primary: true, X-APP-NAME: app-1]'}),
        jasmine.objectContaining({type: 'onActivate', message: 'app-1 - app-1 [primary: false, X-APP-NAME: app-1]'}),
        jasmine.objectContaining({type: 'onActivate', message: 'app-2 - app-2 [primary: true, X-APP-NAME: app-2]'}),
        jasmine.objectContaining({type: 'onActivate', message: 'app-3 - app-3 [primary: true, X-APP-NAME: app-3]'}),
        jasmine.objectContaining({type: 'onActivate', message: 'app-4 - app-4 [primary: true, X-APP-NAME: app-4]'}),
      ],
    ));
  }, 20000); // Increase the timeout as activators signal readiness in the range from 0 to 10s.
});
