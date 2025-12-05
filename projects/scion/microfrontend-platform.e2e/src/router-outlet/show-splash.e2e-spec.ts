/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {RouterOutletPagePO} from './router-outlet-page.po';
import {test} from '../fixtures';
import {OutletRouterPagePO} from './outlet-router-page.po';
import {expect} from '@playwright/test';
import {PublishMessagePagePO} from '../messaging/publish-message-page.po';
import {MicrofrontendCapability, RegisterCapabilityPagePO} from '../manifest/register-capability-page.po';

test.describe('RouterOutlet', () => {

  test('should show splash if `showSplash` is `true`', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      publishMessage: PublishMessagePagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('../test-pages/signal-ready-test-page');
    await routerPO.toggleShowSplash(true);
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();

    // Publish message to dispose splash.
    const publishMessagePO = pagePOs.get<PublishMessagePagePO>('publishMessage');
    await publishMessagePO.enterTopic('signal-ready/testee');
    await publishMessagePO.clickPublish();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should not show splash if `showSplash` is `false`', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('../test-pages/signal-ready-test-page');
    await routerPO.toggleShowSplash(false);
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should show splash if 1st navigation `showSplash` is `false` but 2nd navigation `showSplash` is `true`', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Navigate to 'test-pages/signal-ready-test-page' with `showSplash` set to `false`.
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('../test-pages/signal-ready-test-page');
    await routerPO.toggleShowSplash(false);
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();

    // Navigate to 'test-pages/signal-ready-test-page' again but with `showSplash` set to `true`.
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('../test-pages/signal-ready-test-page');
    await routerPO.toggleShowSplash(true);
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();
  });

  test('should dispose splash if 1st navigation `showSplash` is `true` but 2nd navigation `showSplash` is `false`', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Navigate to 'test-pages/signal-ready-test-page' with `showSplash` set to `true`.
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('../test-pages/signal-ready-test-page');
    await routerPO.toggleShowSplash(true);
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();

    // Navigate to 'test-pages/signal-ready-test-page' again but with `showSplash` set to `false`.
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('../test-pages/signal-ready-test-page');
    await routerPO.toggleShowSplash(false);
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should show splash if supported by the microfrontend capability', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
        showSplash: true,
      },
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();
  });

  test('should not dispose splash if navigating to the same microfrontend capability again', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
        showSplash: true,
      },
      params: [
        {
          name: 'param',
          required: false,
        },
      ],
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();

    // Navigate to the same microfrontend again.
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.enterParams({param: 'test'});
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();
  });

  test('should not show splash if navigating to the same microfrontend capability again and microfrontend has already signaled readiness', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
      publishMessage: PublishMessagePagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
        showSplash: true,
      },
      params: [
        {
          name: 'param',
          required: false,
        },
      ],
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();

    // Publish message to dispose splash.
    const publishMessagePO = pagePOs.get<PublishMessagePagePO>('publishMessage');
    await publishMessagePO.enterTopic('signal-ready/testee');
    await publishMessagePO.clickPublish();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();

    // Navigate to the same microfrontend again.
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.enterParams({param: 'test'});
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should not show splash if not specified by the microfrontend capability', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
      },
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should not show splash if not supported by the microfrontend capability', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
        showSplash: false,
      },
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should ignore `showSplash` passed to router when navigating by intent (1/3)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
        showSplash: false,
      },
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.toggleShowSplash(true);
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });

  test('should ignore `showSplash` passed to router when navigating by intent (2/3)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
        showSplash: true,
      },
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.toggleShowSplash(false);
    await routerPO.clickNavigate();

    // Expect splash to display.
    await expect(routerOutletPagePO.splash.locator).toBeVisible();
    await expect(routerOutletPagePO.splash.slottedContentLocator).toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeAttached();
    await expect(routerOutletPagePO.iframeLocator).not.toBeVisible();
  });

  test('should ignore `showSplash` passed to router when navigating by intent (3/3)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
      capabilityRegisterer: RegisterCapabilityPagePO,
    });

    const routerOutletPagePO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPagePO.enterOutletName('testee');
    await routerOutletPagePO.clickApply();

    // Register "microfrontend" capability
    const capabilityRegisterer = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegisterer');
    await capabilityRegisterer.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend',
      qualifier: {component: 'microfrontend'},
      properties: {
        path: 'test-pages/signal-ready-test-page',
      },
    });

    // Navigate to 'test-pages/signal-ready-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('testee');
    await routerPO.enterIntentQualifier({component: 'microfrontend'});
    await routerPO.toggleShowSplash(true);
    await routerPO.clickNavigate();

    // Expect splash not to display.
    await expect(routerOutletPagePO.splash.locator).not.toBeAttached();
    await expect(routerOutletPagePO.splash.slottedContentLocator).not.toBeVisible();
    await expect(routerOutletPagePO.iframeLocator).toBeVisible();
  });
});
