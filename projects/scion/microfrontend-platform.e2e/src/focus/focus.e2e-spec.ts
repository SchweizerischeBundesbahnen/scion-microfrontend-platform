/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {Microfrontend1PagePO} from '../microfrontend/microfrontend-1-page.po';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('Focus Tracker', () => {

  test('should track the focus across microfrontends (focus-within)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet1a: Microfrontend1PagePO,
        outlet1b: Microfrontend1PagePO,
      },
      outlet2: {
        outlet2a: Microfrontend1PagePO,
        outlet2b: Microfrontend1PagePO,
      },
    });

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    const outlet1a = pagePOs.get<BrowserOutletPO>('outlet1a:outlet');
    const outlet1b = pagePOs.get<BrowserOutletPO>('outlet1b:outlet');
    const microfrontend1a = pagePOs.get<Microfrontend1PagePO>('outlet1a');
    const microfrontend1b = pagePOs.get<Microfrontend1PagePO>('outlet1b');

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    const outlet2a = pagePOs.get<BrowserOutletPO>('outlet2a:outlet');
    const outlet2b = pagePOs.get<BrowserOutletPO>('outlet2b:outlet');
    const microfrontend2a = pagePOs.get<Microfrontend1PagePO>('outlet2a');
    const microfrontend2b = pagePOs.get<Microfrontend1PagePO>('outlet2b');

    // Focus outlet 1 (contained in the root document)
    await outlet1.focusUrl();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(false);
    await expect(await outlet2.isFocusWithinIframe()).toBe(false);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus outlet 1a
    await outlet1a.focusUrl();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(true);
    await expect(await outlet2.isFocusWithinIframe()).toBe(false);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus outlet 2a
    await outlet2a.focusUrl();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(false);
    await expect(await outlet2.isFocusWithinIframe()).toBe(true);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus outlet 1b
    await outlet1b.focusUrl();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(true);
    await expect(await outlet2.isFocusWithinIframe()).toBe(false);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus outlet 2b
    await outlet2b.focusUrl();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(false);
    await expect(await outlet2.isFocusWithinIframe()).toBe(true);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus microfrontend 1a
    await microfrontend1a.inputFieldPO.focus();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(true);
    await expect(await outlet2.isFocusWithinIframe()).toBe(false);
    await expect(await microfrontend1a.isFocusWithin()).toBe(true);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus microfrontend 2a
    await microfrontend2a.inputFieldPO.focus();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(false);
    await expect(await outlet2.isFocusWithinIframe()).toBe(true);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(true);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus microfrontend 1b
    await microfrontend1b.inputFieldPO.focus();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(true);
    await expect(await outlet2.isFocusWithinIframe()).toBe(false);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(true);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(false);

    // Focus microfrontend 2b
    await microfrontend2b.inputFieldPO.focus();
    await expect(await testingAppPO.isFocusWithin()).toBe(true);
    await expect(await outlet1.isFocusWithinIframe()).toBe(false);
    await expect(await outlet2.isFocusWithinIframe()).toBe(true);
    await expect(await microfrontend1a.isFocusWithin()).toBe(false);
    await expect(await microfrontend1b.isFocusWithin()).toBe(false);
    await expect(await microfrontend2a.isFocusWithin()).toBe(false);
    await expect(await microfrontend2b.isFocusWithin()).toBe(true);
  });

  test('should track the focus across microfrontends (has-focus)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend1: Microfrontend1PagePO,
      microfrontend2: Microfrontend1PagePO,
    });

    const microfrontend1 = pagePOs.get<Microfrontend1PagePO>('microfrontend1');
    const microfrontend1Outlet = pagePOs.get<BrowserOutletPO>('microfrontend1:outlet');

    const microfrontend2 = pagePOs.get<Microfrontend1PagePO>('microfrontend2');
    const microfrontend2Outlet = pagePOs.get<BrowserOutletPO>('microfrontend2:outlet');

    // Focus outlet of microfrontend 1 (contained in the root document)
    await microfrontend1Outlet.focusUrl();
    await expect(await testingAppPO.hasFocus()).toBe(true);
    await expect(await microfrontend1.hasFocus()).toBe(false);
    await expect(await microfrontend2.hasFocus()).toBe(false);

    // Click focusable element in microfrontend 1
    await microfrontend1.clickFocusableElement();
    await expect(await testingAppPO.hasFocus()).toBe(false);
    await expect(await microfrontend1.hasFocus()).toBe(true);
    await expect(await microfrontend2.hasFocus()).toBe(false);

    // Click focusable element in microfrontend 2
    await microfrontend2.clickFocusableElement();
    await expect(await testingAppPO.hasFocus()).toBe(false);
    await expect(await microfrontend1.hasFocus()).toBe(false);
    await expect(await microfrontend2.hasFocus()).toBe(true);

    // Click non-focusable element in microfrontend 1
    await microfrontend1.clickNonFocusableElement();
    await expect(await testingAppPO.hasFocus()).toBe(false);
    await expect(await microfrontend1.hasFocus()).toBe(true);
    await expect(await microfrontend2.hasFocus()).toBe(false);

    // Click non-focusable element in microfrontend 2
    await microfrontend2.clickNonFocusableElement();
    await expect(await testingAppPO.hasFocus()).toBe(false);
    await expect(await microfrontend1.hasFocus()).toBe(false);
    await expect(await microfrontend2.hasFocus()).toBe(true);

    // Focus outlet of microfrontend 2 (contained in the root document)
    await microfrontend2Outlet.focusUrl();
    await expect(await testingAppPO.hasFocus()).toBe(true);
    await expect(await microfrontend1.hasFocus()).toBe(false);
    await expect(await microfrontend2.hasFocus()).toBe(false);
  });
});

