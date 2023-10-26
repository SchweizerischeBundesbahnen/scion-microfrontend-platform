/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestingAppOrigins} from '../testing-app.po';
import {OutletRouterPagePO} from './outlet-router-page.po';
import {ContextPagePO} from '../context/context-page.po';
import {RouterOutletPagePO} from './router-outlet-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {Microfrontend1PagePO} from '../microfrontend/microfrontend-1-page.po';
import {Microfrontend2PagePO} from '../microfrontend/microfrontend-2-page.po';
import {RegisterCapabilityPagePO} from '../manifest/register-capability-page.po';
import {RegisterIntentionPagePO} from '../manifest/register-intention-page.po';
import {MessagingFlavor, PublishMessagePagePO} from '../messaging/publish-message-page.po';
import {MicrofrontendCapability} from '@scion/microfrontend-platform';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('RouterOutlet', () => {

  test('should set the name of the router outlet element', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      routerOutlet: RouterOutletPagePO,
    });

    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    await expect(await routerOutletPO.getRouterOutletName()).toEqual('microfrontend-outlet');
  });

  test('should set the iframe name to the outlet name', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      routerOutlet: RouterOutletPagePO,
    });

    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    await expect(await routerOutletPO.getRouterOutletFrameName()).toEqual('microfrontend-outlet');
  });

  test('should allow navigating within the outlet (self navigation)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');

    // Load the outlet router into the router outlet under test in order to self navigate inside the router outlet
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${OutletRouterPagePO.PATH}`);
    await routerPO.clickNavigate();

    // Name the router outlet under test
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to another site (test-pages/microfrontend-1-test-page) inside the outlet under test
    const testeePO = new OutletRouterPagePO(routerOutletPO.routerOutletFrameLocator);
    await testeePO.enterUrl(`../${Microfrontend1PagePO.PATH}`); // do not specify a target outlet
    await testeePO.clickNavigate();

    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH}));
  });

  test('should not reload the app when navigating within the app in the same outlet [pushState=disabled]', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page' (app-1)
    const microfrontend_1_app1_pageUrl = getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Capture the app instance id of the loaded microfrontend (app-1)
    const microfrontendPO = new Microfrontend1PagePO(routerOutletPO.routerOutletFrameLocator);
    const app1InstanceId = await microfrontendPO.getAppInstanceId();
    const componentInstanceId = await microfrontendPO.getComponentInstanceId();

    // Navigate to 'test-pages/microfrontend-2-test-page' of the same app (app-1)
    const microfrontend_2_app1_pageUrl = getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_2_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to 'test-pages/microfrontend-1-test-page' of the same app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate to 'test-pages/microfrontend-1-test-page' of another app (app-2)
    const microfrontend_1_app2_pageUrl = getPageUrl({origin: TestingAppOrigins.APP_2, path: Microfrontend1PagePO.PATH});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app2_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to 'test-pages/microfrontend-1-test-page' of the previous app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);
  });

  test('should not reload the app when navigating within the app in the same outlet [pushState=enabled]', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page' (app-1)
    const microfrontend_1_app1_pageUrl = getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Capture the app instance id of the loaded microfrontend (app-1)
    const microfrontendPO = new Microfrontend1PagePO(routerOutletPO.routerOutletFrameLocator);

    const app1InstanceId = await microfrontendPO.getAppInstanceId();
    const componentInstanceId = await microfrontendPO.getComponentInstanceId();

    // Navigate to 'test-pages/microfrontend-2-test-page' of the same app (app-1)
    const microfrontend_2_app1_pageUrl = getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_2_app1_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to 'test-pages/microfrontend-1-test-page' of the same app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);
    // Navigate to 'test-pages/microfrontend-1-test-page' of another app (app-2)
    const microfrontend_1_app2_pageUrl = getPageUrl({origin: TestingAppOrigins.APP_2, path: Microfrontend1PagePO.PATH});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app2_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to 'test-pages/microfrontend-1-test-page' of the previous app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);
  });

  test('should not reload the app when updating URL params or the URL fragment', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Capture the instance ids of the loaded microfrontend
    const microfrontendPO = new Microfrontend1PagePO(routerOutletPO.routerOutletFrameLocator);
    const microfrontendComponentInstanceId = await microfrontendPO.getComponentInstanceId();
    const microfrontendAppInstanceId = await microfrontendPO.getAppInstanceId();

    await expect(await microfrontendPO.getQueryParams()).toEqual({});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({});
    await expect(await microfrontendPO.getFragment()).toEqual('');

    // Navigate to the same microfrontend with some query params set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}?param1=value1&param2=value2`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual({'param1': 'value1', 'param2': 'value2'});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({});
    await expect(await microfrontendPO.getFragment()).toEqual('');

    // Navigate to the same microfrontend with some matrix params set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH};param1=value1;param2=value2`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual({});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({'param1': 'value1', 'param2': 'value2'});
    await expect(await microfrontendPO.getFragment()).toEqual('');

    // Navigate to the same microfrontend with the fragment set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}#fragment`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual({});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({});
    await expect(await microfrontendPO.getFragment()).toEqual('fragment');

    // Navigate to the same microfrontend with params and fragment set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH};matrixParam1=value1;matrixParam2=value2?queryParam1=value1&queryParam2=value2#fragment`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual({'queryParam1': 'value1', 'queryParam2': 'value2'});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({'matrixParam1': 'value1', 'matrixParam2': 'value2'});
    await expect(await microfrontendPO.getFragment()).toEqual('fragment');
  });

  test('should not distinct navigations', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      outlet: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('outlet');

    // Prepare the router outlet
    await routerOutletPO.enterOutletName('testee');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify 'test-pages/microfrontend-1-test-page' to display in the outlet
    await expect(routerOutletPO.getEmbeddedContentUrl()).resolves.toEqual(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-2-test-page' using `location.href` (not the router)
    await routerOutletPO.setEmbeddedContentUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    // Verify 'test-pages/microfrontend-2-test-page' to display in the outlet
    await expect(routerOutletPO.getEmbeddedContentUrl()).resolves.toEqual(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-1-test-page' using the router.
    // For the router, this navigation is identical to the last navigation for that outlet.
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify 'test-pages/microfrontend-1-test-page' to display again
    await expect(routerOutletPO.getEmbeddedContentUrl()).resolves.toEqual(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should allow looking up the outlet context in a router outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${ContextPagePO.PATH}`);
    await routerPO.clickNavigate();

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify the outlet context to be set
    const contextPO = new ContextPagePO(routerOutletPO.routerOutletFrameLocator);
    await expect(await contextPO.getContext()).toMatchObject({'ɵOUTLET': expect.objectContaining({name: 'microfrontend-outlet'})});  // OUTLET_CONTEXT constant cannot be accessed in test
  });

  test('should show the requested page when mounting the outlet after navigation has taken place', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: 'about:blank',
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const browserOutletPO = pagePOs.get<BrowserOutletPO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Mount the router outlet
    await browserOutletPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.PATH}));
    const routerOutletPO = new RouterOutletPagePO(browserOutletPO.routerOutletFrameLocator);
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should show the requested page when setting the outlet name after navigation has taken place', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Set the outlet name
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should show the requested page when an outlet name is set for which a previous navigation has taken place', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet-1');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();
    await routerPO.enterOutletName('microfrontend-outlet-2');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Set the outlet name
    await routerOutletPO.enterOutletName('microfrontend-outlet-1');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Change the outlet name to some name for which a previous routing has taken place
    await routerOutletPO.enterOutletName('microfrontend-outlet-2');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should show a blank page when an outlet name is set for which no previous navigation has been done yet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet-1');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();
    await expect(await routerOutletPO.isEmpty()).toBe(true);

    // Set the outlet name
    await routerOutletPO.enterOutletName('microfrontend-outlet-1');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(await routerOutletPO.isEmpty()).toBe(false);

    // Change the outlet name to some name for which no previous routing has taken place
    await routerOutletPO.enterOutletName('microfrontend-outlet-2');
    await routerOutletPO.clickApply();

    // Verify that an empty page is displayed
    await expect(routerOutletPO).toHaveRouterOutletUrl('about:blank');
    await expect(await routerOutletPO.isEmpty()).toBe(true);
  });

  test('should show a blank page when clearing the outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify the page to be empty
    await expect(await routerOutletPO.isEmpty()).toBe(true);

    // Navigate to the page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(await routerOutletPO.isEmpty()).toBe(false);

    // Navigate to the `null` page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(null);
    await routerPO.clickNavigate();
    // Verify that an empty page is displayed
    await expect(routerOutletPO).toHaveRouterOutletUrl('about:blank');
    await expect(await routerOutletPO.isEmpty()).toBe(true);
  });

  test('should show the requested page in the router outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
      otherOutlet: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    const otherRouterOutletPO = pagePOs.get<RouterOutletPagePO>('otherOutlet');
    await otherRouterOutletPO.enterOutletName('other-outlet');
    await otherRouterOutletPO.clickApply();
    await expect(await routerOutletPO.isEmpty()).toBe(true);

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(await routerOutletPO.isEmpty()).toBe(false);
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(otherRouterOutletPO).toHaveRouterOutletUrl('about:blank');

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(await routerOutletPO.isEmpty()).toBe(false);
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(otherRouterOutletPO).toHaveRouterOutletUrl('about:blank');
  });

  test('should show the requested page in all outlets having set the specified outlet name', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      outlet1: {
        routerOutlet1: RouterOutletPagePO,
        routerOutlet2: RouterOutletPagePO,
        outlet2: {
          routerOutlet3: RouterOutletPagePO,
        },
      },
      routerOutlet4: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutlet1PO = pagePOs.get<RouterOutletPagePO>('routerOutlet1');
    await routerOutlet1PO.enterOutletName('microfrontend-outlet');
    await routerOutlet1PO.clickApply();

    const routerOutlet2PO = pagePOs.get<RouterOutletPagePO>('routerOutlet2');
    await routerOutlet2PO.enterOutletName('microfrontend-outlet');
    await routerOutlet2PO.clickApply();

    const routerOutlet3PO = pagePOs.get<RouterOutletPagePO>('routerOutlet3');
    await routerOutlet3PO.enterOutletName('microfrontend-outlet');
    await routerOutlet3PO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that all outlets show 'test-pages/microfrontend-1-test-page'
    await expect(routerOutlet1PO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(routerOutlet2PO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(routerOutlet3PO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should mount a router outlet as primary outlet if not specifying an outlet name', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');

    // Navigate to 'test-pages/microfrontend-1-test-page' in the primary outlet
    await routerPO.enterOutletName('primary'); // PRIMARY_OUTLET constant cannot be accessed in test
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should show the requested page in the primary outlet if not in the context of an outlet and if no target outlet is specified', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('router:outlet');
    const routerOutletContextPO = await outletPO.openRouterOutletContext();
    await routerOutletContextPO.removeContextValue('ɵOUTLET'); // OUTLET_CONTEXT constant cannot be accessed in test
    await routerOutletContextPO.close();

    // Navigate to 'test-pages/microfrontend-1-test-page' in the primary outlet
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should not create a browser history entry when navigating (by default)', async ({page, testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate back in the browser
    await page.goBack();

    // Verify to navigate back to the initial blank page
    await expect(page.url()).toEqual('about:blank');
  });

  test('should create a browser history entry when navigating using the \'push\' location update strategy', async ({page, testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });
    const initialUrl = page.url();

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}`);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate back in the browser
    await Promise.race([
      page.waitForEvent('framenavigated'),
      // From the point of view of Playwright, {@link Page#goBack} operation fails, because no `load` event is fired.
      // Therefore, we wait for the navigation to complete, i.e., waiting for the `framenavigated` event to be fired.
      page.goBack({timeout: 100}).catch(() => Promise.resolve()),
    ]);

    // Verify to navigate back to the 'browser-outlets' page, and not to the initial blank page
    await expect(page.url()).toEqual(initialUrl);
  });

  test('should allow relative navigation', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`./../${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`./../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`/${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl('.');
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: OutletRouterPagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should substitute matrix params when navigating', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH};product=:product;brand=:brand`);
    await routerPO.enterParams({'product': 'shampoo', 'brand': 'greenline'});
    await routerPO.clickNavigate();

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend1PagePO(routerOutletPO.routerOutletFrameLocator);

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getQueryParams()).toEqual({});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({'product': 'shampoo', 'brand': 'greenline'});
    await expect(await microfrontendPO.getFragment()).toEqual('');
  });

  test('should substitute query params when navigating', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}?product=:product&brand=:brand`);
    await routerPO.enterParams({'product': 'shampoo', 'brand': 'greenline'});
    await routerPO.clickNavigate();

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend2PagePO(routerOutletPO.routerOutletFrameLocator);

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getQueryParams()).toEqual({'product': 'shampoo', 'brand': 'greenline'});
    await expect(await microfrontendPO.getMatrixParams()).toEqual({});
    await expect(await microfrontendPO.getFragment()).toEqual('');
  });

  test('should substitute path params when navigating', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}/:product/:brand`);
    await routerPO.enterParams({'product': 'shampoo', 'brand': 'greenline'});
    await routerPO.clickNavigate();

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend2PagePO(routerOutletPO.routerOutletFrameLocator);

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getMatrixParams()).toEqual({'param1': 'shampoo', 'param2': 'greenline'});
    await expect(await microfrontendPO.getQueryParams()).toEqual({});
    await expect(await microfrontendPO.getFragment()).toEqual('');
  });

  test('should substitute the fragment when navigating', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}#:product`);
    await routerPO.enterParams({'product': 'shampoo'});
    await routerPO.clickNavigate();

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend2PagePO(routerOutletPO.routerOutletFrameLocator);

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getMatrixParams()).toEqual({});
    await expect(await microfrontendPO.getQueryParams()).toEqual({});
    await expect(await microfrontendPO.getFragment()).toEqual('shampoo');
  });

  test('should emit outlet activate and deactivate events on navigation', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify the navigation and the emitted activation events
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(await consoleLogs.get({severity: 'debug', filter: /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/, consume: true})).toEqualIgnoreOrder([
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
    ]);

    // Navigate to 'test-pages/microfrontend-2-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify the emitted events
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    await expect(await consoleLogs.get({severity: 'debug', filter: /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/})).toEqualIgnoreOrder([
      `[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
    ]);
  });

  test('should emit an activation event when mounting the outlet after navigation has taken place', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Navigate to 'test-pages/microfrontend-1-test-page'
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Mount the outlet
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify the emitted events
    await expect(await consoleLogs.get({severity: 'debug', filter: /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/})).toEqualIgnoreOrder([
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
    ]);
  });

  test('should emit an activation event for the page \'about:blank\' when clearing the outlet', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Clear the outlet
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(null);
    await routerPO.clickNavigate();

    // Verify the page 'about:blank' to be displayed
    await expect(routerOutletPO).toHaveRouterOutletUrl('about:blank');

    // Navigate to 'test-pages/microfrontend-1-test-page'
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.PATH}`);
    await routerPO.clickNavigate();

    // Verify the emitted events
    await expect(await consoleLogs.get({severity: 'debug', filter: /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/})).toEqualIgnoreOrder([
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
      `[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
      '[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=about:blank]',
      '[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=microfrontend-outlet, url=about:blank]',
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}))}]`,
    ]);
    // Verify the page 'test-pages/microfrontend-2-test-page' to be displayed
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend2PagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test('should allow nesting outlets', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const testeeOutletPO = pagePOs.get<BrowserOutletPO>('testee:outlet');

    // Load a nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL1PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL1PO.enterOutletName('nested-router-outlet-1');
    await routerOutletL1PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-1');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_2, path: RouterOutletPagePO.PATH}));
    await routerPO.clickNavigate();

    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL1PO).toHaveRouterOutletUrl(getPageUrl({path: RouterOutletPagePO.PATH, origin: TestingAppOrigins.APP_2}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL2PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL2PO.enterOutletName('nested-router-outlet-2');
    await routerOutletL2PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-2');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_3, path: RouterOutletPagePO.PATH}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL2PO).toHaveRouterOutletUrl(getPageUrl({path: RouterOutletPagePO.PATH, origin: TestingAppOrigins.APP_3}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet> but showing another app
    const routerOutletL3PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL3PO.enterOutletName('nested-router-outlet-3');
    await routerOutletL3PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-3');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_4, path: Microfrontend1PagePO.PATH}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL3PO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_4}));
  });

  test('should work around Chrome bug when displaying nested outlets of the same app (see method `RouterOutletUrlAssigner#patchUrl` for more detail about the problem)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const testeeOutletPO = pagePOs.get<BrowserOutletPO>('testee:outlet');

    // Load a nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL1PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL1PO.enterOutletName('nested-router-outlet-1');
    await routerOutletL1PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-1');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.PATH}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL1PO).toHaveRouterOutletUrl(getPageUrl({path: RouterOutletPagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL2PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL2PO.enterOutletName('nested-router-outlet-2');
    await routerOutletL2PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-2');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.PATH}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL2PO).toHaveRouterOutletUrl(getPageUrl({path: RouterOutletPagePO.PATH, origin: TestingAppOrigins.APP_1}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet> but showing another app
    const routerOutletL3PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL3PO.enterOutletName('nested-router-outlet-3');
    await routerOutletL3PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-3');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_2, path: RouterOutletPagePO.PATH}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL3PO).toHaveRouterOutletUrl(getPageUrl({path: RouterOutletPagePO.PATH, origin: TestingAppOrigins.APP_2}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet> but showing another app
    const routerOutletL4PO = new RouterOutletPagePO(testeeOutletPO.routerOutletFrameLocator);
    await routerOutletL4PO.enterOutletName('nested-router-outlet-4');
    await routerOutletL4PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-4');
    await routerPO.enterUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.PATH}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expect(routerOutletL4PO).toHaveRouterOutletUrl(getPageUrl({path: RouterOutletPagePO.PATH, origin: TestingAppOrigins.APP_1}));
  });

  test(`should emit the 'focuswithin' event [This test only works if the browser window keeps the focus while executing the test, i.e. the browser window is the active window or the test runs headless.]`, async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      root: {
        outlet1: {
          testee1: Microfrontend1PagePO,
          testee2: Microfrontend1PagePO,
        },
        outlet2: {
          testee3: Microfrontend1PagePO,
          testee4: Microfrontend1PagePO,
        },
      },
    });

    const rootBrowserOutletPO = pagePOs.get<BrowserOutletPO>('root');

    const outlet1PO = pagePOs.get<BrowserOutletPO>('outlet1');
    const testee1 = pagePOs.get<Microfrontend1PagePO>('testee1');
    const testee2 = pagePOs.get<Microfrontend1PagePO>('testee2');

    const outlet2PO = pagePOs.get<BrowserOutletPO>('outlet2');
    const testee3 = pagePOs.get<Microfrontend1PagePO>('testee3');
    const testee4 = pagePOs.get<Microfrontend1PagePO>('testee4');

    // Focus the root document in order to have no microfrontend focused
    await rootBrowserOutletPO.focusUrl();
    await consoleLogs.clear();

    await testee1.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=true]`,
    ]);

    await testee2.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=true]`,
    ]);

    await testee3.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=true]`,
    ]);

    await testee4.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee4, focuswithin=true]`,
    ]);

    await outlet2PO.focusUrl();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee4, focuswithin=false]`,
    ]);

    await outlet1PO.focusUrl();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqual([]);

    await rootBrowserOutletPO.focusUrl();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/})).toEqual([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=false]`,
    ]);
  });

  test(`should not emit the 'focuswithin' event while the focus remains within the outlet's microfrontend or any of its child microfrontends [This test only works if the browser window keeps the focus while executing the test, i.e. the browser window is the active window or the test runs headless.]`, async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      root: {
        outlet1: {
          outlet2: {
            testee1: Microfrontend1PagePO,
            testee2: Microfrontend1PagePO,
            testee3: Microfrontend1PagePO,
          },
        },
      },
    });

    const rootBrowserOutletPO = pagePOs.get<BrowserOutletPO>('root');

    const outlet1PO = pagePOs.get<BrowserOutletPO>('outlet1');
    const outlet2PO = pagePOs.get<BrowserOutletPO>('outlet2');
    const testee1 = pagePOs.get<Microfrontend1PagePO>('testee1');
    const testee2 = pagePOs.get<Microfrontend1PagePO>('testee2');
    const testee3 = pagePOs.get<Microfrontend1PagePO>('testee3');

    // Focus the root document in order to have no microfrontend focused
    await rootBrowserOutletPO.focusUrl();
    await consoleLogs.clear();

    await testee1.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=true]`,
    ]);

    await testee2.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=true]`,
    ]);

    await testee3.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=true]`,
    ]);

    await outlet2PO.focusUrl();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=false]`,
    ]);

    await outlet1PO.focusUrl();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/, consume: true})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=false]`,
    ]);

    await rootBrowserOutletPO.focusUrl();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/})).toEqual([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=false]`,
    ]);
  });

  test(`should wait emitting the 'focuswithin' event until first receiving the focus [This test only works if the browser window keeps the focus while executing the test, i.e. the browser window is the active window or the test runs headless.]`, async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      testee: Microfrontend1PagePO,
    });

    const testeePO = pagePOs.get<Microfrontend1PagePO>('testee');

    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/})).toEqual([]);

    await testeePO.inputFieldPO.focus();
    await expect(await consoleLogs.get({severity: 'debug', filter: /BrowserOutletComponent::sci-router-outlet:onfocuswithin/})).toEqualIgnoreOrder([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee, focuswithin=true]`,
    ]);
  });

  test('should route the primary outlet via url if in the context of an activator and if not specifying a target outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      messageClient: PublishMessagePagePO,
      routerOutlet: RouterOutletPagePO,
    }, {queryParams: new Map().set('manifestClassifier', 'activator-routing')});

    // prepare the router outlet
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPO.clickApply();

    // send message to the activator to navigate to 'test-pages/microfrontend-1-test-page'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-url');
    await messageClientPO.enterHeaders({'path': `/${Microfrontend1PagePO.PATH}`});
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'test-pages/microfrontend-1-test-page'
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'test-pages/microfrontend-2-test-page'
    await messageClientPO.enterHeaders({'path': `/${Microfrontend2PagePO.PATH}`});
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'test-pages/microfrontend-2-test-page'
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH}));
  });

  test('should route the specified outlet via url if in the context of an activator', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      messageClient: PublishMessagePagePO,
      primaryRouterOutlet: RouterOutletPagePO,
      secondaryRouterOutlet: RouterOutletPagePO,
    }, {queryParams: new Map().set('manifestClassifier', 'activator-routing')});

    // prepare the router outlets
    const primaryRouterOutletPO = pagePOs.get<RouterOutletPagePO>('primaryRouterOutlet');
    await primaryRouterOutletPO.clickApply();

    const secondaryRouterOutletPO = pagePOs.get<RouterOutletPagePO>('secondaryRouterOutlet');
    await secondaryRouterOutletPO.enterOutletName('secondary');
    await secondaryRouterOutletPO.clickApply();

    // send message to the activator to navigate to 'test-pages/microfrontend-1-test-page'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-url');
    await messageClientPO.enterHeaders({
      'outlet': 'secondary',
      'path': `/${Microfrontend1PagePO.PATH}`,
    });
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expect(primaryRouterOutletPO).toHaveRouterOutletUrl('about:blank');
    // expect the secondary router outlet to be navigated
    await expect(secondaryRouterOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'test-pages/microfrontend-2-test-page'
    await messageClientPO.enterHeaders({
      'outlet': 'secondary',
      'path': `/${Microfrontend2PagePO.PATH}`,
    });
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expect(primaryRouterOutletPO).toHaveRouterOutletUrl('about:blank');
    // expect the secondary router outlet to be navigated
    await expect(secondaryRouterOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH}));
  });

  test.describe('Intent-based Routing', () => {

    test('should navigate to a microfrontend of the same app', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO.enterOutletName('microfrontend-outlet');
      await routerOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.clickNavigate();

      // Verify that navigation was successful
      await expect(await routerOutletPO.isEmpty()).toBe(false);
      await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
    });

    test('should navigate to a microfrontend provided by another app', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: {useClass: OutletRouterPagePO, origin: TestingAppOrigins.APP_1},
        routerOutlet: {useClass: RouterOutletPagePO, origin: TestingAppOrigins.APP_1},
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page in app-1
      const routerOutletPO_app1 = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO_app1.enterOutletName('microfrontend-outlet');
      await routerOutletPO_app1.clickApply();

      // register "microfrontend" capability in app-2
      const registerCapabilityPO_app2 = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
      await registerCapabilityPO_app2.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        private: false,
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
        },
      });

      // register intention in app-1
      const registerIntentionPO_app1 = await controllerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
      await registerIntentionPO_app1.registerIntention({type: 'microfrontend', qualifier: {entity: 'person'}});

      // Navigate to the microfrontend via intent-based routing
      const routerPO_app1 = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO_app1.enterOutletName('microfrontend-outlet');
      await routerPO_app1.enterIntentQualifier({entity: 'person'});
      await routerPO_app1.clickNavigate();

      // Verify that navigation was successful
      await expect(await routerOutletPO_app1.isEmpty()).toBe(false);
      await expect(routerOutletPO_app1).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_2}));
    });

    test('should reject navigation to a microfrontend of another app if missing the intention', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: {useClass: OutletRouterPagePO, origin: TestingAppOrigins.APP_1},
        routerOutlet: {useClass: RouterOutletPagePO, origin: TestingAppOrigins.APP_1},
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page in app-1
      const routerOutletPO_app1 = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO_app1.enterOutletName('microfrontend-outlet');
      await routerOutletPO_app1.clickApply();

      // register "microfrontend" capability in app-2
      const registerCapabilityPO_app2 = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
      await registerCapabilityPO_app2.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        private: false,
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
        },
      });

      // Try navigating to the microfrontend via intent-based routing
      const routerPO_app1 = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO_app1.enterOutletName('microfrontend-outlet');
      await routerPO_app1.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO_app1.clickNavigate();

      // Verify that the navigation failed
      await expect(navigate).rejects.toThrow(/\[NotQualifiedError]/);
      await expect(await routerOutletPO_app1.isEmpty()).toBe(true);
      await expect(routerOutletPO_app1).toHaveRouterOutletUrl('about:blank');
    });

    test('should reject navigation to a microfrontend of another app if the microfrontend capability is private', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: {useClass: OutletRouterPagePO, origin: TestingAppOrigins.APP_1},
        routerOutlet: {useClass: RouterOutletPagePO, origin: TestingAppOrigins.APP_1},
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page in app-1
      const routerOutletPO_app1 = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO_app1.enterOutletName('microfrontend-outlet');
      await routerOutletPO_app1.clickApply();

      // register intention in app-1
      const registerIntentionPO_app1 = await controllerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
      await registerIntentionPO_app1.registerIntention({type: 'microfrontend', qualifier: {entity: 'person'}});

      // register "microfrontend" capability in app-2
      const registerCapabilityPO_app2 = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
      await registerCapabilityPO_app2.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        private: true,
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
        },
      });

      // Try navigating to the microfrontend via intent-based routing
      const routerPO_app1 = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO_app1.enterOutletName('microfrontend-outlet');
      await routerPO_app1.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO_app1.clickNavigate();

      // Verify that the navigation failed
      await expect(navigate).rejects.toThrow(/\[NullProviderError]/);
      await expect(await routerOutletPO_app1.isEmpty()).toBe(true);
      await expect(routerOutletPO_app1).toHaveRouterOutletUrl('about:blank');
    });

    test('should reject navigation if the microfrontend does not exist', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: {useClass: OutletRouterPagePO, origin: TestingAppOrigins.APP_1},
        routerOutlet: {useClass: RouterOutletPagePO, origin: TestingAppOrigins.APP_1},
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page in app-1
      const routerOutletPO_app1 = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO_app1.enterOutletName('microfrontend-outlet');
      await routerOutletPO_app1.clickApply();

      // register intention in app-1
      const registerIntentionPO_app1 = await controllerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
      await registerIntentionPO_app1.registerIntention({type: 'microfrontend', qualifier: {entity: 'person'}});

      // Try navigating to the microfrontend via intent-based routing
      const routerPO_app1 = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO_app1.enterOutletName('microfrontend-outlet');
      await routerPO_app1.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO_app1.clickNavigate();

      // Verify that the navigation failed
      await expect(navigate).rejects.toThrow(/\[NullProviderError]/);
      await expect(await routerOutletPO_app1.isEmpty()).toBe(true);
      await expect(routerOutletPO_app1).toHaveRouterOutletUrl('about:blank');
    });

    test('should substitute matrix params when navigating', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO.enterOutletName('microfrontend-outlet');
      await routerOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        params: [
          {name: 'id', required: true},
        ],
        properties: {
          path: 'test-pages/microfrontend-1-test-page;id=:id',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.enterParams({'id': '123'});
      await routerPO.clickNavigate();

      const microfrontendPO = new Microfrontend1PagePO(routerOutletPO.routerOutletFrameLocator);

      // Verify that navigation was successful
      await expect(await microfrontendPO.getMatrixParams()).toEqual({'id': '123'});
      await expect(await microfrontendPO.getQueryParams()).toEqual({});
    });

    test('should substitute query params when navigating', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO.enterOutletName('microfrontend-outlet');
      await routerOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        params: [
          {name: 'id', required: true},
        ],
        properties: {
          path: 'test-pages/microfrontend-1-test-page?id=:id',
        },
      });

      const microfrontendPO = new Microfrontend1PagePO(routerOutletPO.routerOutletFrameLocator);

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.enterParams({'id': '123'});
      await routerPO.clickNavigate();

      // Verify that navigation was successful
      await expect(await microfrontendPO.getQueryParams()).toEqual({'id': '123'});
      await expect(await microfrontendPO.getMatrixParams()).toEqual({});
    });

    test('should reject navigation if not passing required params', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO.enterOutletName('microfrontend-outlet');
      await routerOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        params: [
          {name: 'id', required: true},
        ],
        properties: {
          path: 'test-pages/microfrontend-1-test-page?id=:id',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO.clickNavigate();

      // Verify that the navigation failed
      await expect(navigate).rejects.toThrow(/IntentParamValidationError/);
      await expect(await routerOutletPO.isEmpty()).toBe(true);
      await expect(routerOutletPO).toHaveRouterOutletUrl('about:blank');
    });

    test('should reject navigation if passing params that are not defined by the capability', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO.enterOutletName('microfrontend-outlet');
      await routerOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.enterParams({'id': '123'});
      const navigate = routerPO.clickNavigate();

      // Verify that the navigation failed
      await expect(navigate).rejects.toThrow(/IntentParamValidationError/);
      await expect(await routerOutletPO.isEmpty()).toBe(true);
      await expect(routerOutletPO).toHaveRouterOutletUrl('about:blank');
    });

    test('should reject navigation if the microfrontend capability does not define the path to the microfrontend', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await routerOutletPO.enterOutletName('microfrontend-outlet');
      await routerOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO.clickNavigate();

      // Verify that the navigation failed
      await expect(navigate).rejects.toThrow(/\[OutletRouterError]\[NullPathError]/);
      await expect(await routerOutletPO.isEmpty()).toBe(true);
      await expect(routerOutletPO).toHaveRouterOutletUrl('about:blank');
    });

    test('should navigate to a microfrontend in the specified outlet', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        preferredOutlet: RouterOutletPagePO,
        primaryOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open router outlet page
      const outletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
      await outletPO.enterOutletName('outlet');
      await outletPO.clickApply();

      // open preferred router outlet page
      const preferredOutletPO = pagePOs.get<RouterOutletPagePO>('preferredOutlet');
      await preferredOutletPO.enterOutletName('preferred-outlet');
      await preferredOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
          outlet: 'preferred-outlet',
        },
      });

      // Prepare the primary outlet
      const primaryOutlet = pagePOs.get<RouterOutletPagePO>('primaryOutlet');
      await primaryOutlet.enterOutletName('primary');
      await primaryOutlet.clickApply();

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.clickNavigate();

      // Verify that navigation was successful
      await expect(await outletPO.isEmpty()).toBe(false);
      await expect(outletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));

      // Verify the specified outlet not to be routed
      await expect(await preferredOutletPO.isEmpty()).toBe(true);
      await expect(preferredOutletPO).toHaveRouterOutletUrl('about:blank');
      // Verify the primary outlet not to be routed
      await expect(primaryOutlet.getEmbeddedContentUrl()).resolves.toEqual('about:blank');
    });

    test('should navigate to a microfrontend in the preferred outlet', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        preferredOutlet: RouterOutletPagePO,
        primaryOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');

      // open preferred router outlet page
      const preferredOutletPO = pagePOs.get<RouterOutletPagePO>('preferredOutlet');
      await preferredOutletPO.enterOutletName('preferred-outlet');
      await preferredOutletPO.clickApply();

      // register "microfrontend" capability
      const registerCapabilityPO = await controllerOutlet.enterUrl<RegisterCapabilityPagePO>(RegisterCapabilityPagePO);
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
          outlet: 'preferred-outlet',
        },
      });

      // Prepare the primary outlet
      const primaryOutlet = pagePOs.get<RouterOutletPagePO>('primaryOutlet');
      await primaryOutlet.enterOutletName('primary');
      await primaryOutlet.clickApply();

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.clickNavigate();

      // Verify the preferred outlet not to be routed
      await expect(await preferredOutletPO.isEmpty()).toBe(false);
      await expect(preferredOutletPO).toHaveRouterOutletUrl(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
      // Verify the primary outlet not to be routed
      await expect(primaryOutlet.getEmbeddedContentUrl()).resolves.toEqual('about:blank');
    });

    test('should navigate to a microfrontend in the current outlet', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        registerCapability: RegisterCapabilityPagePO,
        primaryOutlet: RouterOutletPagePO,
      });

      // register "microfrontend" capability
      const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        properties: {
          path: 'test-pages/microfrontend-1-test-page',
        },
      });

      // Prepare the primary outlet
      const primaryOutlet = pagePOs.get<RouterOutletPagePO>('primaryOutlet');
      await primaryOutlet.enterOutletName('primary');
      await primaryOutlet.clickApply();

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.clickNavigate();

      // Verify that the navigation replaced the current outlet
      await expect(pagePOs.get<BrowserOutletPO>('router:outlet').getEmbeddedContentUrl()).resolves.toEqual(getPageUrl({path: Microfrontend1PagePO.PATH, origin: TestingAppOrigins.APP_1}));
      // Verify the primary outlet not to be routed
      await expect(primaryOutlet.getEmbeddedContentUrl()).resolves.toEqual('about:blank');
    });
  });

  test('should route the primary outlet via intent if in the context of an activator and if not specifying a target outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      messageClient: PublishMessagePagePO,
      routerOutlet: RouterOutletPagePO,
      registerCapability: RegisterCapabilityPagePO,
    }, {queryParams: new Map().set('manifestClassifier', 'activator-routing')});

    // prepare the router outlet
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPO.clickApply();

    // register "microfrontend" capability
    const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-1'},
      properties: {
        path: Microfrontend1PagePO.PATH,
      },
    });
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-2'},
      properties: {
        path: Microfrontend2PagePO.PATH,
      },
    });

    // send message to the activator to navigate to 'test-pages/microfrontend-1-test-page'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-intent');
    await messageClientPO.enterHeaders({'qualifier': JSON.stringify({comp: 'microfrontend-1'})});
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'test-pages/microfrontend-1-test-page'
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'test-pages/microfrontend-2-test-page'
    await messageClientPO.enterHeaders({'qualifier': JSON.stringify({comp: 'microfrontend-2'})});
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'test-pages/microfrontend-2-test-page'
    await expect(routerOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH}));
  });

  test('should route the specified outlet via intent if in the context of an activator', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      messageClient: PublishMessagePagePO,
      primaryRouterOutlet: RouterOutletPagePO,
      secondaryRouterOutlet: RouterOutletPagePO,
      registerCapability: RegisterCapabilityPagePO,
    }, {queryParams: new Map().set('manifestClassifier', 'activator-routing')});

    // prepare the router outlets
    const primaryRouterOutletPO = pagePOs.get<RouterOutletPagePO>('primaryRouterOutlet');
    await primaryRouterOutletPO.clickApply();

    const secondaryRouterOutletPO = pagePOs.get<RouterOutletPagePO>('secondaryRouterOutlet');
    await secondaryRouterOutletPO.enterOutletName('secondary');
    await secondaryRouterOutletPO.clickApply();

    // register "microfrontend" capability
    const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-1'},
      properties: {
        path: Microfrontend1PagePO.PATH,
      },
    });
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-2'},
      properties: {
        path: Microfrontend2PagePO.PATH,
      },
    });

    // send message to the activator to navigate to 'test-pages/microfrontend-1-test-page'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-intent');
    await messageClientPO.enterHeaders({
      'outlet': 'secondary',
      'qualifier': JSON.stringify({comp: 'microfrontend-1'}),
    });
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expect(primaryRouterOutletPO).toHaveRouterOutletUrl('about:blank');
    // expect the secondary router outlet to be navigated
    await expect(secondaryRouterOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'test-pages/microfrontend-2-test-page'
    await messageClientPO.enterHeaders({
      'outlet': 'secondary',
      'qualifier': JSON.stringify({comp: 'microfrontend-2'}),
    });
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expect(primaryRouterOutletPO).toHaveRouterOutletUrl('about:blank');
    // expect the secondary router outlet to be navigated
    await expect(secondaryRouterOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH}));
  });

  test('should route the preferred outlet if in the context of an activator', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      messageClient: PublishMessagePagePO,
      primaryRouterOutlet: RouterOutletPagePO,
      secondaryRouterOutlet: RouterOutletPagePO,
      registerCapability: RegisterCapabilityPagePO,
    }, {queryParams: new Map().set('manifestClassifier', 'activator-routing')});

    // prepare the router outlets
    const primaryRouterOutletPO = pagePOs.get<RouterOutletPagePO>('primaryRouterOutlet');
    await primaryRouterOutletPO.clickApply();

    const secondaryRouterOutletPO = pagePOs.get<RouterOutletPagePO>('secondaryRouterOutlet');
    await secondaryRouterOutletPO.enterOutletName('secondary');
    await secondaryRouterOutletPO.clickApply();

    // register "microfrontend" capability
    const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-1'},
      properties: {
        path: Microfrontend1PagePO.PATH,
        outlet: 'secondary',
      },
    });
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-2'},
      properties: {
        path: Microfrontend2PagePO.PATH,
        outlet: 'secondary',
      },
    });

    // send message to the activator to navigate to 'test-pages/microfrontend-1-test-page'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-intent');
    await messageClientPO.enterHeaders({'qualifier': JSON.stringify({comp: 'microfrontend-1'})});
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expect(primaryRouterOutletPO).toHaveRouterOutletUrl('about:blank');
    // expect the secondary router outlet to be navigated
    await expect(secondaryRouterOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.PATH}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'test-pages/microfrontend-2-test-page'
    await messageClientPO.enterHeaders({'qualifier': JSON.stringify({comp: 'microfrontend-2'})});
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expect(primaryRouterOutletPO).toHaveRouterOutletUrl('about:blank');
    // expect the secondary router outlet to be navigated
    await expect(secondaryRouterOutletPO).toHaveRouterOutletUrl(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.PATH}));
  });

  test('should hide iframe if empty', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');

    // Expect iframe to be invisible if not having performed a navigation yet
    await expect(routerOutletPO.iframeLocator).not.toBeVisible();

    // WHEN: Setting the outlet name
    await routerOutletPO.enterOutletName('testee');
    await routerOutletPO.clickApply();
    // THEN: Expect iframe to still be invisible
    await expect(routerOutletPO.iframeLocator).not.toBeVisible();

    // WHEN: Navigating to a microfrontend
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('/test-pages/microfrontend-1-test-page');
    await routerPO.clickNavigate();
    // THEN: Expect iframe to be visible
    await expect(routerOutletPO.iframeLocator).toBeVisible();

    // WHEN: Clearing the outlet
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl(null);
    await routerPO.clickNavigate();
    // THEN: Expect iframe to be invisible
    await expect(routerOutletPO.iframeLocator).not.toBeVisible();

    // WHEN: Navigating to a microfrontend
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('/test-pages/microfrontend-1-test-page');
    await routerPO.clickNavigate();
    // THEN: Expect iframe to be visible
    await expect(routerOutletPO.iframeLocator).toBeVisible();

    // WHEN: Navigating to 'about:bank'
    await routerPO.enterOutletName('testee');
    await routerPO.enterUrl('about:blank');
    await routerPO.clickNavigate();
    // THEN: Expect iframe to be invisible
    await expect(routerOutletPO.iframeLocator).not.toBeVisible();
  });
});

function getPageUrl(parts: {origin: string; path: string}): string {
  return new URL(`/#/${parts.path}`, parts.origin).toString();
}
