/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {OutletPageObjectMap} from '../testing-app.po';
import {OutletRouterPagePO} from '../router-outlet/outlet-router-page.po';
import {RouterOutletPagePO} from '../router-outlet/router-outlet-page.po';
import {PreferredSizePagePO} from './preferred-size-page.po';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('RouterOutlet', () => {

  test('should be a noop when setting the preferred size outside of an outlet context (e.g. when running as standalone application)', async ({page}) => {
    await page.goto(`/#/${PreferredSizePagePO.PATH}`);
    const preferredSizePO = new PreferredSizePagePO(page);
    const originalWidth = (await preferredSizePO.getSize()).width;
    const originalHeight = (await preferredSizePO.getSize()).height;

    await preferredSizePO.checkUseElementSize(false);
    await preferredSizePO.enterPreferredWidth('555px');
    await preferredSizePO.enterPreferredHeight('444px');
    await expect(await preferredSizePO.getSize()).toEqual({width: originalWidth, height: originalHeight});
  });

  test('should allow resetting the preferred size on the outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    const preferredSizePO = await navigateToPreferredPage(pagePOs);
    const originalWidth = (await routerOutletPO.getRouterOutletSize()).width;
    const originalHeight = (await routerOutletPO.getRouterOutletSize()).height;

    await preferredSizePO.checkUseElementSize(false);
    await preferredSizePO.enterPreferredWidth('555px');
    await preferredSizePO.enterPreferredHeight('444px');
    await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: 444});

    // Reset the preferred size
    const routerOutletSettingsPO = await routerOutletPO.openRouterOutletSettings();
    await routerOutletSettingsPO.clickPreferredSizeReset();
    await routerOutletSettingsPO.close();
    await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: originalWidth, height: originalHeight});
  });

  test.describe('Set the preferred outlet size programmatically', () => {

    test('should adjust the outlet to the preferred size', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);

      await preferredSizePO.checkUseElementSize(false);
      await preferredSizePO.enterPreferredWidth('555px');
      await preferredSizePO.enterPreferredHeight('444px');
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: 444});
    });

    test('should return to the original layout when the preferred size is reset', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);
      const originalWidth = (await routerOutletPO.getRouterOutletSize()).width;
      const originalHeight = (await routerOutletPO.getRouterOutletSize()).height;

      await preferredSizePO.checkUseElementSize(false);
      await preferredSizePO.enterPreferredWidth('555px');
      await preferredSizePO.enterPreferredHeight('444px');
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: 444});

      // Reset the preferred size
      await preferredSizePO.clickReset();
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: originalWidth, height: originalHeight});
    });

    test('should return to the original layout width when unsetting the preferred width', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);
      const originalWidth = (await routerOutletPO.getRouterOutletSize()).width;

      await preferredSizePO.checkUseElementSize(false);
      await preferredSizePO.enterPreferredWidth('555px');
      await preferredSizePO.enterPreferredHeight('444px');
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: 444});

      // Unset the preferred width
      await preferredSizePO.enterPreferredWidth(null);
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: originalWidth, height: 444});
    });

    test('should return to the original layout height when unsetting the preferred height', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);
      const originalHeight = (await routerOutletPO.getRouterOutletSize()).height;

      await preferredSizePO.checkUseElementSize(false);
      await preferredSizePO.enterPreferredWidth('555px');
      await preferredSizePO.enterPreferredHeight('444px');
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: 444});

      // Unset the preferred height
      await preferredSizePO.enterPreferredHeight(null);
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: originalHeight});
    });
  });

  test.describe('Use the element\'s size as the preferred outlet size', () => {

    test('should adjust the outlet to the observing element size', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);
      const originalWidth = (await routerOutletPO.getRouterOutletSize()).width;
      const originalHeight = (await routerOutletPO.getRouterOutletSize()).height;

      // Use the content size as the preferred outlet size
      await preferredSizePO.checkUseElementSize(true);
      await preferredSizePO.clickBindElementObservable();
      await expect(await routerOutletPO.getRouterOutletSize()).not.toEqual({width: originalWidth, height: originalHeight});

      // Set the content size as CSS variables
      await preferredSizePO.enterCssWidth('555px');
      await preferredSizePO.enterCssHeight('444px');
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 555, height: 444});

      // Set the content size as CSS variables
      await preferredSizePO.enterCssWidth('666px');
      await preferredSizePO.enterCssHeight('555px');
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: 666, height: 555});
    });

    test('should return to the original layout when the observing element is unbound as element size observable', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);
      const originalWidth = (await routerOutletPO.getRouterOutletSize()).width;
      const originalHeight = (await routerOutletPO.getRouterOutletSize()).height;

      // Use the content size as the preferred outlet size
      await preferredSizePO.checkUseElementSize(true);
      await preferredSizePO.clickBindElementObservable();
      await expect(await routerOutletPO.getRouterOutletSize()).not.toEqual({width: originalWidth, height: originalHeight});

      await preferredSizePO.clickUnbindElementObservable();
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: originalWidth, height: originalHeight});
    });

    test('should return to the original layout when the observing element is unmounted from the DOM', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        testee: RouterOutletPagePO,
      });
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
      const preferredSizePO = await navigateToPreferredPage(pagePOs);
      const originalWidth = (await routerOutletPO.getRouterOutletSize()).width;
      const originalHeight = (await routerOutletPO.getRouterOutletSize()).height;

      // Use the content size as the preferred outlet size
      await preferredSizePO.checkUseElementSize(true);
      await preferredSizePO.clickBindElementObservable();
      await expect(await routerOutletPO.getRouterOutletSize()).not.toEqual({width: originalWidth, height: originalHeight});

      await preferredSizePO.clickUnmount();
      await expect(await routerOutletPO.getRouterOutletSize()).toEqual({width: originalWidth, height: originalHeight});
    });
  });

  async function navigateToPreferredPage(pagePOs: OutletPageObjectMap): Promise<PreferredSizePagePO> {
    // Navigate to the 'preferred-size' page
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${PreferredSizePagePO.PATH}`);
    await routerPO.clickNavigate();

    // Mount the outlet to show the 'preferred-size' page
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    return new PreferredSizePagePO(routerOutletPO.routerOutletFrameLocator);
  }
});

