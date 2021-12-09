/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {browserNavigateBack, consumeBrowserLog, expectMap, waitUntilLocation} from '../spec.util';
import {TestingAppOrigins, TestingAppPO} from '../testing-app.po';
import {browser, logging} from 'protractor';
import {OutletRouterPagePO} from './outlet-router-page.po';
import {ContextPagePO} from '../context/context-page.po';
import {RouterOutletPagePO} from './router-outlet-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {Microfrontend1PagePO} from '../microfrontend/microfrontend-1-page.po';
import {Microfrontend2PagePO} from '../microfrontend/microfrontend-2-page.po';
import {installSeleniumWebDriverClickFix} from '../selenium-webdriver-click-fix';
import Level = logging.Level;

describe('RouterOutlet', () => {

  installSeleniumWebDriverClickFix();
  beforeEach(() => consumeBrowserLog());

  it('should allow navigating within the outlet (self navigation)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      routerOutlet: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');

    // Load the outlet router into the router outlet under test in order to self navigate inside the router outlet
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${OutletRouterPagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Name the router outlet under test
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to another site (microfrontend-1) inside the outlet under test
    const testeePO = new OutletRouterPagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());
    await testeePO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`); // do not specify a target outlet
    await testeePO.clickNavigate();

    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl}));
  });

  it('should not reload the app when navigating within the app in the same outlet [pushState=disabled]', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the microfrontend-1 page (app-1)
    const microfrontend_1_app1_pageUrl = await getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Capture the app instance id of the loaded microfrontend (app-1)
    const microfrontendPO = new Microfrontend1PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());
    await microfrontendPO.waitUntilLocation(microfrontend_1_app1_pageUrl);
    const app1InstanceId = await microfrontendPO.getAppInstanceId();
    const componentInstanceId = await microfrontendPO.getComponentInstanceId();

    // Navigate to the microfrontend-2 page of the same app (app-1)
    const microfrontend_2_app1_pageUrl = await getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_2_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await microfrontendPO.waitUntilLocation(microfrontend_2_app1_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to the microfrontend-1 page of the same app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await microfrontendPO.waitUntilLocation(microfrontend_1_app1_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate to the microfrontend-1 page of another app (app-2)
    const microfrontend_1_app2_pageUrl = await getPageUrl({origin: TestingAppOrigins.APP_2, path: Microfrontend1PagePO.pageUrl});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app2_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await microfrontendPO.waitUntilLocation(microfrontend_1_app2_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to the microfrontend-1 page of the previous app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await microfrontendPO.waitUntilLocation(microfrontend_1_app1_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);
  });

  it('should not reload the app when navigating within the app in the same outlet [pushState=enabled]', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the microfrontend-1 page (app-1)
    const microfrontend_1_app1_pageUrl = await getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Capture the app instance id of the loaded microfrontend (app-1)
    const microfrontendPO = new Microfrontend1PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

    await microfrontendPO.waitUntilLocation(microfrontend_1_app1_pageUrl);
    const app1InstanceId = await microfrontendPO.getAppInstanceId();
    const componentInstanceId = await microfrontendPO.getComponentInstanceId();

    // Navigate to the microfrontend-2 page of the same app (app-1)
    const microfrontend_2_app1_pageUrl = await getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_2_app1_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await microfrontendPO.waitUntilLocation(microfrontend_2_app1_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to the microfrontend-1 page of the same app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that the app instance id has not changed, meaning the app did not reload
    await microfrontendPO.waitUntilLocation(microfrontend_1_app1_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);
    // Navigate to the microfrontend-1 page of another app (app-2)
    const microfrontend_1_app2_pageUrl = await getPageUrl({origin: TestingAppOrigins.APP_2, path: Microfrontend1PagePO.pageUrl});
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app2_pageUrl);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await microfrontendPO.waitUntilLocation(microfrontend_1_app2_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);

    // Navigate back to the microfrontend-1 page of the previous app (app-1)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(microfrontend_1_app1_pageUrl);
    await routerPO.clickNavigate();

    // Verify that the app instance id did change because loaded another app
    await microfrontendPO.waitUntilLocation(microfrontend_1_app1_pageUrl);
    await expect(await microfrontendPO.getAppInstanceId()).not.toEqual(app1InstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).not.toEqual(componentInstanceId);
  });

  it('should not reload the app when updating URL params or the URL fragment', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the microfrontend-1 page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Capture the instance ids of the loaded microfrontend
    const microfrontendPO = new Microfrontend1PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());
    const microfrontendComponentInstanceId = await microfrontendPO.getComponentInstanceId();
    const microfrontendAppInstanceId = await microfrontendPO.getAppInstanceId();

    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map());
    await expect(await microfrontendPO.getFragment()).toEqual('');

    // Navigate to the same microfrontend with some query params set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}?param1=value1&param2=value2`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map().set('param1', 'value1').set('param2', 'value2'));
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map());
    await expect(await microfrontendPO.getFragment()).toEqual('');

    // Navigate to the same microfrontend with some matrix params set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl};param1=value1;param2=value2`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map().set('param1', 'value1').set('param2', 'value2'));
    await expect(await microfrontendPO.getFragment()).toEqual('');

    // Navigate to the same microfrontend with the fragment set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}#fragment`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map());
    await expect(await microfrontendPO.getFragment()).toEqual('fragment');

    // Navigate to the same microfrontend with params and fragment set
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl};matrixParam1=value1;matrixParam2=value2?queryParam1=value1&queryParam2=value2#fragment`);
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getAppInstanceId()).toEqual(microfrontendAppInstanceId);
    await expect(await microfrontendPO.getComponentInstanceId()).toEqual(microfrontendComponentInstanceId);
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map().set('queryParam1', 'value1').set('queryParam2', 'value2'));
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map().set('matrixParam1', 'value1').set('matrixParam2', 'value2'));
    await expect(await microfrontendPO.getFragment()).toEqual('fragment');
  });

  it('should allow looking up the outlet context in a router outlet', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${ContextPagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Instrument the router outlet
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify the outlet context to be set
    const contextPO = new ContextPagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());
    await expectMap(contextPO.getContext()).toContain(new Map().set('ɵOUTLET', jasmine.objectContaining({name: 'microfrontend-outlet'})));  // OUTLET_CONTEXT constant cannot be accessed in protractor test
  });

  it('should show the requested page when mounting the outlet after navigation has taken place', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: 'about:blank',
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const browserOutletPO = pagePOs.get<BrowserOutletPO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Mount the router outlet
    await browserOutletPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.pageUrl}));
    const routerOutletPO = new RouterOutletPagePO((): Promise<void> => browserOutletPO.switchToOutletIframe());
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should show the requested page when setting the outlet name after navigation has taken place', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Set the outlet name
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should show the requested page when an outlet name is set for which a previous navigation has taken place', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet-1');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    await routerPO.enterOutletName('microfrontend-outlet-2');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Set the outlet name
    await routerOutletPO.enterOutletName('microfrontend-outlet-1');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Change the outlet name to some name for which a previous routing has taken place
    await routerOutletPO.enterOutletName('microfrontend-outlet-2');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should show a blank page when an outlet name is set for which no previous navigation has been done yet', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');

    // Navigate to the page (before the outlet is mounted)
    await routerPO.enterOutletName('microfrontend-outlet-1');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    await expect(await routerOutletPO.isEmpty()).toBe(true);

    // Set the outlet name
    await routerOutletPO.enterOutletName('microfrontend-outlet-1');
    await routerOutletPO.clickApply();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expect(await routerOutletPO.isEmpty()).toBe(false);

    // Change the outlet name to some name for which no previous routing has taken place
    await routerOutletPO.enterOutletName('microfrontend-outlet-2');
    await routerOutletPO.clickApply();

    // Verify that an empty page is displayed
    await expectRouterOutletUrl(routerOutletPO).toEqual('about:blank');
    await expect(await routerOutletPO.isEmpty()).toBe(true);
  });

  it('should show a blank page when clearing the outlet', async () => {
    const testingAppPO = new TestingAppPO();
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
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expect(await routerOutletPO.isEmpty()).toBe(false);

    // Navigate to the `null` page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(null);
    await routerPO.clickNavigate();
    // Verify that an empty page is displayed
    await expectRouterOutletUrl(routerOutletPO).toEqual('about:blank');
    await expect(await routerOutletPO.isEmpty()).toBe(true);
  });

  it('should show the requested page in the router outlet', async () => {
    const testingAppPO = new TestingAppPO();
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

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(await routerOutletPO.isEmpty()).toBe(false);
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expectRouterOutletUrl(otherRouterOutletPO).toEqual('about:blank');

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expect(await routerOutletPO.isEmpty()).toBe(false);
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expectRouterOutletUrl(otherRouterOutletPO).toEqual('about:blank');
  });

  it('should show the requested page in all outlets having set the specified outlet name', async () => {
    const testingAppPO = new TestingAppPO();
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

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that all outlets show 'microfrontend-1' page
    await expectRouterOutletUrl(routerOutlet1PO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expectRouterOutletUrl(routerOutlet2PO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expectRouterOutletUrl(routerOutlet3PO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should mount a router outlet as primary outlet if not specifying an outlet name', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');

    // Navigate to the 'microfrontend-1' page in the primary outlet
    await routerPO.enterOutletName('primary'); // PRIMARY_OUTLET constant cannot be accessed in protractor test
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should show the requested page in the primary outlet if not in the context of an outlet and if no target outlet is specified', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('router:outlet');
    await outletPO.outletContextPO.open();
    await outletPO.outletContextPO.removeContextValue('ɵOUTLET'); // OUTLET_CONTEXT constant cannot be accessed in protractor test
    await outletPO.outletContextPO.close();

    // Navigate to the 'microfrontend-1' page in the primary outlet
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should not create a browser history entry when navigating (by default)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate back in the browser
    await browserNavigateBack();

    // Verify to navigate back to the initial blank page
    await expect(await browser.driver.getCurrentUrl()).toEqual('about:blank');
  });

  it('should create a browser history entry when navigating using the \'push\' location update strategy', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });
    const initialUrl = browser.getCurrentUrl();

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.togglePushState(true);
    await routerPO.clickNavigate();
    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate back in the browser
    await browserNavigateBack();

    // Verify to navigate back to the 'browser-outlets' page, and not to the initial blank page
    await expect(browser.driver.getCurrentUrl()).toEqual(initialUrl);
  });

  it('should allow relative navigation', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`./../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`./../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`/${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl('.');
    await routerPO.clickNavigate();

    // Verify that navigation was successful
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: OutletRouterPagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should substitute matrix params when navigating', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend1PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl};product=:product;brand=:brand`);
    await routerPO.enterParams(new Map().set('product', 'shampoo').set('brand', 'greenline'));
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map().set('product', 'shampoo').set('brand', 'greenline'));
    await expect(await microfrontendPO.getFragment()).toEqual('');
  });

  it('should substitute query params when navigating', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend2PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}?product=:product&brand=:brand`);
    await routerPO.enterParams(new Map().set('product', 'shampoo').set('brand', 'greenline'));
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map().set('product', 'shampoo').set('brand', 'greenline'));
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map());
    await expect(await microfrontendPO.getFragment()).toEqual('');
  });

  it('should substitute path params when navigating', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend2PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}/:product/:brand`);
    await routerPO.enterParams(new Map().set('product', 'shampoo').set('brand', 'greenline'));
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map().set('param1', 'shampoo').set('param2', 'greenline'));
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    await expect(await microfrontendPO.getFragment()).toEqual('');
  });

  it('should substitute the fragment when navigating', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Page Object of the loaded microfrontend
    const microfrontendPO = new Microfrontend2PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

    // Name the router outlet under test
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}#:product`);
    await routerPO.enterParams(new Map().set('product', 'shampoo'));
    await routerPO.clickNavigate();

    // Verify params and fragment and that the app did not reload
    await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map());
    await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    await expect(await microfrontendPO.getFragment()).toEqual('shampoo');
  });

  it('should emit outlet activate and deactivate events on navigation', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify the navigation and the emitted activation events
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expect(await consumeBrowserLog(Level.DEBUG, /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/)).toEqual(jasmine.arrayWithExactContents([
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
    ]));

    // Navigate to the 'microfrontend-2' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify the emitted events
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    await expect(await consumeBrowserLog(Level.DEBUG, /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/)).toEqual(jasmine.arrayWithExactContents([
      `[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
    ]));
  });

  it('should emit an activation event when mounting the outlet after navigation has taken place', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    // Navigate to the 'microfrontend-1' page
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Mount the outlet
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Verify the emitted events
    await expect(await consumeBrowserLog(Level.DEBUG, /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/)).toEqual(jasmine.arrayWithExactContents([
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
    ]));
  });

  it('should emit an activation event for the page \'about:blank\' when clearing the outlet', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('testee');
    await routerOutletPO.enterOutletName('microfrontend-outlet');
    await routerOutletPO.clickApply();

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend1PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Clear the outlet
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(null);
    await routerPO.clickNavigate();

    // Verify the page 'about:blank' to be displayed
    await expectRouterOutletUrl(routerOutletPO).toEqual('about:blank');

    // Navigate to the 'microfrontend-1' page
    await routerPO.enterOutletName('microfrontend-outlet');
    await routerPO.enterUrl(`../${Microfrontend2PagePO.pageUrl}`);
    await routerPO.clickNavigate();

    // Verify the emitted events
    await expect(await consumeBrowserLog(Level.DEBUG, /RouterOutletComponent::sci-router-outlet:(onactivate|ondeactivate)/)).toEqual(jasmine.arrayWithExactContents([
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
      `[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
      '[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=about:blank]',
      '[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=microfrontend-outlet, url=about:blank]',
      `[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=microfrontend-outlet, url=${(await getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}))}]`,
    ]));
    // Verify the page 'microfrontend-2' to be displayed
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend2PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it('should allow nesting outlets', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const testeeOutletPO = pagePOs.get<BrowserOutletPO>('testee:outlet');

    // Load a nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL1PO = new RouterOutletPagePO((): Promise<void> => testeeOutletPO.switchToOutletIframe());
    await routerOutletL1PO.enterOutletName('nested-router-outlet-1');
    await routerOutletL1PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-1');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_2, path: RouterOutletPagePO.pageUrl}));
    await routerPO.clickNavigate();

    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL1PO).toEqual(getPageUrl({path: RouterOutletPagePO.pageUrl, origin: TestingAppOrigins.APP_2}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL2PO = new RouterOutletPagePO((): Promise<void> => routerOutletL1PO.switchToRouterOutletIframe());
    await routerOutletL2PO.enterOutletName('nested-router-outlet-2');
    await routerOutletL2PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-2');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_3, path: RouterOutletPagePO.pageUrl}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL2PO).toEqual(getPageUrl({path: RouterOutletPagePO.pageUrl, origin: TestingAppOrigins.APP_3}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet> but showing another app
    const routerOutletL3PO = new RouterOutletPagePO((): Promise<void> => routerOutletL2PO.switchToRouterOutletIframe());
    await routerOutletL3PO.enterOutletName('nested-router-outlet-3');
    await routerOutletL3PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-3');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_4, path: Microfrontend1PagePO.pageUrl}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL3PO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_4}));
  });

  it('should work around Chrome bug when displaying nested outlets of the same app (see method `RouterOutletUrlAssigner#patchUrl` for more detail about the problem)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      router: OutletRouterPagePO,
      testee: RouterOutletPagePO,
    });

    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    const testeeOutletPO = pagePOs.get<BrowserOutletPO>('testee:outlet');

    // Load a nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL1PO = new RouterOutletPagePO((): Promise<void> => testeeOutletPO.switchToOutletIframe());
    await routerOutletL1PO.enterOutletName('nested-router-outlet-1');
    await routerOutletL1PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-1');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.pageUrl}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL1PO).toEqual(getPageUrl({path: RouterOutletPagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet>
    const routerOutletL2PO = new RouterOutletPagePO((): Promise<void> => routerOutletL1PO.switchToRouterOutletIframe());
    await routerOutletL2PO.enterOutletName('nested-router-outlet-2');
    await routerOutletL2PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-2');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.pageUrl}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL2PO).toEqual(getPageUrl({path: RouterOutletPagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet> but showing another app
    const routerOutletL3PO = new RouterOutletPagePO((): Promise<void> => routerOutletL2PO.switchToRouterOutletIframe());
    await routerOutletL3PO.enterOutletName('nested-router-outlet-3');
    await routerOutletL3PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-3');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_2, path: RouterOutletPagePO.pageUrl}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL3PO).toEqual(getPageUrl({path: RouterOutletPagePO.pageUrl, origin: TestingAppOrigins.APP_2}));

    // Load another nested <sci-router-outlet> into the <sci-router-outlet> but showing another app
    const routerOutletL4PO = new RouterOutletPagePO((): Promise<void> => routerOutletL3PO.switchToRouterOutletIframe());
    await routerOutletL4PO.enterOutletName('nested-router-outlet-4');
    await routerOutletL4PO.clickApply();
    await routerPO.enterOutletName('nested-router-outlet-4');
    await routerPO.enterUrl(await getPageUrl({origin: TestingAppOrigins.APP_1, path: RouterOutletPagePO.pageUrl}));
    await routerPO.clickNavigate();
    // Verify that the nested <sci-router-outlet> is displayed
    await expectRouterOutletUrl(routerOutletL4PO).toEqual(getPageUrl({path: RouterOutletPagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
  });

  it(`should emit the 'focuswithin' event [This test only works if the browser window keeps the focus while executing the test, i.e. the browser window is the active window or the test runs headless.]`, async () => {
    const testingAppPO = new TestingAppPO();
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
    await rootBrowserOutletPO.clickUrl();

    await consumeBrowserLog();

    await testee1.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=true]`,
    ]));

    await testee2.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=true]`,
    ]));

    await testee3.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=true]`,
    ]));

    await testee4.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee4, focuswithin=true]`,
    ]));

    await outlet2PO.clickUrl();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee4, focuswithin=false]`,
    ]));

    await outlet1PO.clickUrl();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual([]);

    await rootBrowserOutletPO.clickUrl();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=false]`,
    ]);
  });

  it(`should not emit the 'focuswithin' event while the focus remains within the outlet's microfrontend or any of its child microfrontends [This test only works if the browser window keeps the focus while executing the test, i.e. the browser window is the active window or the test runs headless.]`, async () => {
    const testingAppPO = new TestingAppPO();
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
    await rootBrowserOutletPO.clickUrl();

    await consumeBrowserLog();

    await testee1.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=true]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=true]`,
    ]));

    await testee2.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee1, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=true]`,
    ]));

    await testee3.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee2, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=true]`,
    ]));

    await outlet2PO.clickUrl();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee3, focuswithin=false]`,
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet2, focuswithin=false]`,
    ]));

    await outlet1PO.clickUrl();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=outlet1, focuswithin=false]`,
    ]));

    await rootBrowserOutletPO.clickUrl();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=root, focuswithin=false]`,
    ]);
  });

  it(`should wait emitting the'focuswithin' event until first receiving the focus [This test only works if the browser window keeps the focus while executing the test, i.e. the browser window is the active window or the test runs headless.]`, async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      testee: Microfrontend1PagePO,
    });

    const testeePO = pagePOs.get<Microfrontend1PagePO>('testee');

    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual([]);

    await testeePO.clickInputField();
    await expect(await consumeBrowserLog(Level.DEBUG, /BrowserOutletComponent::sci-router-outlet:onfocuswithin/)).toEqual(jasmine.arrayWithExactContents([
      `[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=testee, focuswithin=true]`,
    ]));
  });
});

async function getPageUrl(parts: {origin: string; path: string}): Promise<string> {
  const origin = new URL(await browser.getCurrentUrl()).origin;
  const url = new URL(`/#/${parts.path}`, origin);
  url.port = new URL(parts.origin).port;
  return url.toString();
}

/**
 * Expects the given router outlet to display content of the given URL. This expectation fails if not entering that location within 5 seconds.
 */
function expectRouterOutletUrl(routerOutletPO: RouterOutletPagePO): {toEqual: (expected: string | Promise<string>) => Promise<void>} {
  return {
    toEqual: async (expected: string | Promise<string>): Promise<void> => {
      const expectedLocation = await expected;
      try {
        await routerOutletPO.switchToRouterOutletIframe();
        await waitUntilLocation(expectedLocation, 5000);
      }
      catch {
        fail(`Expected URL of router outlet to be '${expectedLocation}', but was '${await routerOutletPO.getRouterOutletUrl()}'.`);
      }
    },
  };
}
