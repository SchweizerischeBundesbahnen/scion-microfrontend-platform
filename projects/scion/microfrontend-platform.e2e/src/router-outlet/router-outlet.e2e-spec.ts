/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {browserNavigateBack, consumeBrowserLog, expectMap, expectPromise, waitUntilLocation} from '../spec.util';
import {TestingAppOrigins, TestingAppPO} from '../testing-app.po';
import {browser, logging} from 'protractor';
import {OutletRouterPagePO} from './outlet-router-page.po';
import {ContextPagePO} from '../context/context-page.po';
import {RouterOutletPagePO} from './router-outlet-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {Microfrontend1PagePO} from '../microfrontend/microfrontend-1-page.po';
import {Microfrontend2PagePO} from '../microfrontend/microfrontend-2-page.po';
import {installSeleniumWebDriverClickFix} from '../selenium-webdriver-click-fix';
import {RegisterCapabilityPagePO} from '../manifest/register-capability-page.po';
import {RegisterIntentionPagePO} from '../manifest/register-intention-page.po';
import {MessagingFlavor, PublishMessagePagePO} from '../messaging/publish-message-page.po';
import {MicrofrontendCapability} from '@scion/microfrontend-platform';
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
    await testeePO.clickNavigate({evalNavigateResponse: false});

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

  it('should route the primary outlet if in the context of an activator and if not specifying a target outlet', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      messageClient: PublishMessagePagePO,
      routerOutlet: RouterOutletPagePO,
    }, {queryParams: new Map().set('manifestClassifier', 'activator-routing')});

    // prepare the router outlet
    const routerOutletPO = pagePOs.get<RouterOutletPagePO>('routerOutlet');
    await routerOutletPO.clickApply();

    // send message to the activator to navigate to 'microfrontend-1'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-url');
    await messageClientPO.enterHeaders(new Map().set('path', `/${Microfrontend1PagePO.pageUrl}`));
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'microfrontend-1'
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'microfrontend-2'
    await messageClientPO.enterHeaders(new Map().set('path', `/${Microfrontend2PagePO.pageUrl}`));
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'microfrontend-2'
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl}));
  });

  it('should route the specified outlet if in the context of an activator', async () => {
    const testingAppPO = new TestingAppPO();
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

    // send message to the activator to navigate to 'microfrontend-1'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-url');
    await messageClientPO.enterHeaders(new Map()
      .set('outlet', 'secondary')
      .set('path', `/${Microfrontend1PagePO.pageUrl}`));
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expectRouterOutletUrl(primaryRouterOutletPO).toEqual('about:blank');
    // expect the secondary router outlet to be navigated
    await expectRouterOutletUrl(secondaryRouterOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'microfrontend-2'
    await messageClientPO.enterHeaders(new Map()
      .set('outlet', 'secondary')
      .set('path', `/${Microfrontend2PagePO.pageUrl}`));
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expectRouterOutletUrl(primaryRouterOutletPO).toEqual('about:blank');
    // expect the secondary router outlet to be navigated
    await expectRouterOutletUrl(secondaryRouterOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl}));
  });

  describe('Intent-based Routing', () => {

    it('should navigate to a microfrontend of the same app', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.clickNavigate();

      // Verify that navigation was successful
      await expect(await routerOutletPO.isEmpty()).toBe(false);
      await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
    });

    it('should navigate to a microfrontend provided by another app', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
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
      await expectRouterOutletUrl(routerOutletPO_app1).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_2}));
    });

    it('should reject navigation to a microfrontend of another app if missing the intention', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
        },
      });

      // Try navigating to the microfrontend via intent-based routing
      const routerPO_app1 = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO_app1.enterOutletName('microfrontend-outlet');
      await routerPO_app1.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO_app1.clickNavigate();

      // Verify that the navigation failed
      await expectPromise(navigate).toReject(/\[NotQualifiedError]/);
      await expect(await routerOutletPO_app1.isEmpty()).toBe(true);
      await expectRouterOutletUrl(routerOutletPO_app1).toEqual('about:blank');
    });

    it('should reject navigation to a microfrontend of another app if the microfrontend capability is private', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
        },
      });

      // Try navigating to the microfrontend via intent-based routing
      const routerPO_app1 = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO_app1.enterOutletName('microfrontend-outlet');
      await routerPO_app1.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO_app1.clickNavigate();

      // Verify that the navigation failed
      await expectPromise(navigate).toReject(/\[NullProviderError]/);
      await expect(await routerOutletPO_app1.isEmpty()).toBe(true);
      await expectRouterOutletUrl(routerOutletPO_app1).toEqual('about:blank');
    });

    it('should reject navigation if the microfrontend does not exist', async () => {
      const testingAppPO = new TestingAppPO();
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
      await expectPromise(navigate).toReject(/\[NullProviderError]/);
      await expect(await routerOutletPO_app1.isEmpty()).toBe(true);
      await expectRouterOutletUrl(routerOutletPO_app1).toEqual('about:blank');
    });

    it('should substitute matrix params when navigating', async () => {
      const testingAppPO = new TestingAppPO();
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');
      const microfrontendPO = new Microfrontend1PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

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
          path: 'microfrontend-1;id=:id',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.enterParams(new Map().set('id', '123'));
      await routerPO.clickNavigate();

      // Verify that navigation was successful
      await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map().set('id', '123'));
      await expect(await microfrontendPO.getQueryParams()).toEqual(new Map());
    });

    it('should substitute query params when navigating', async () => {
      const testingAppPO = new TestingAppPO();
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        routerOutlet: RouterOutletPagePO,
        controller: 'about:blank',
      });

      const controllerOutlet = pagePOs.get<BrowserOutletPO>('controller');
      const microfrontendPO = new Microfrontend1PagePO((): Promise<void> => routerOutletPO.switchToRouterOutletIframe());

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
          path: 'microfrontend-1?id=:id',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.enterParams(new Map().set('id', '123'));
      await routerPO.clickNavigate();

      // Verify that navigation was successful
      await expect(await microfrontendPO.getQueryParams()).toEqual(new Map().set('id', '123'));
      await expect(await microfrontendPO.getMatrixParams()).toEqual(new Map());
    });

    it('should reject navigation if not passing required params', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1?id=:id',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      const navigate = routerPO.clickNavigate();

      // Verify that the navigation failed
      await expectPromise(navigate).toReject(/\[ParamMismatchError]/);
      await expect(await routerOutletPO.isEmpty()).toBe(true);
      await expectRouterOutletUrl(routerOutletPO).toEqual('about:blank');
    });

    it('should reject navigation if passing params that are not defined by the capability', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
        },
      });

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterOutletName('microfrontend-outlet');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.enterParams(new Map().set('id', '123'));
      const navigate = routerPO.clickNavigate();

      // Verify that the navigation failed
      await expectPromise(navigate).toReject(/\[ParamMismatchError]/);
      await expect(await routerOutletPO.isEmpty()).toBe(true);
      await expectRouterOutletUrl(routerOutletPO).toEqual('about:blank');
    });

    it('should reject navigation if the microfrontend capability does not define the path to the microfrontend', async () => {
      const testingAppPO = new TestingAppPO();
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
      await expectPromise(navigate).toReject(/\[OutletRouterError]\[NullPathError]/);
      await expect(await routerOutletPO.isEmpty()).toBe(true);
      await expectRouterOutletUrl(routerOutletPO).toEqual('about:blank');
    });

    it('should navigate to a microfrontend in the specified outlet', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
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
      await expectRouterOutletUrl(outletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));

      // Verify the specified outlet not to be routed
      await expect(await preferredOutletPO.isEmpty()).toBe(true);
      await expectRouterOutletUrl(preferredOutletPO).toEqual('about:blank');
      // Verify the primary outlet not to be routed
      await expectPromise(primaryOutlet.getRouterOutletUrl()).toResolve('about:blank');
    });

    it('should navigate to a microfrontend in the preferred outlet', async () => {
      const testingAppPO = new TestingAppPO();
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
          path: 'microfrontend-1',
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
      await expectRouterOutletUrl(preferredOutletPO).toEqual(getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1}));
      // Verify the primary outlet not to be routed
      await expectPromise(primaryOutlet.getRouterOutletUrl()).toResolve('about:blank');
    });

    it('should navigate to a microfrontend in the current outlet', async () => {
      const testingAppPO = new TestingAppPO();
      const pagePOs = await testingAppPO.navigateTo({
        router: OutletRouterPagePO,
        registerCapability: RegisterCapabilityPagePO,
        primaryOutlet: RouterOutletPagePO,
      });

      const microfrontend1Url = await getPageUrl({path: Microfrontend1PagePO.pageUrl, origin: TestingAppOrigins.APP_1});

      // register "microfrontend" capability
      const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
      await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
        type: 'microfrontend' as any,
        qualifier: {entity: 'person'},
        properties: {
          path: 'microfrontend-1',
        },
      });

      // Prepare the primary outlet
      const primaryOutlet = pagePOs.get<RouterOutletPagePO>('primaryOutlet');
      await primaryOutlet.enterOutletName('primary');
      await primaryOutlet.clickApply();

      // Navigate to the microfrontend via intent-based routing
      const routerPO = pagePOs.get<OutletRouterPagePO>('router');
      await routerPO.enterIntentQualifier({entity: 'person'});
      await routerPO.clickNavigate({evalNavigateResponse: false});

      // Verify that the navigation replaced the current outlet
      await expectPromise(waitUntilLocation(microfrontend1Url)).toResolve();
      // Verify the primary outlet not to be routed
      await expectPromise(primaryOutlet.getRouterOutletUrl()).toResolve('about:blank');
    });
  });

  it('should route the primary outlet if in the context of an activator and if not specifying a target outlet', async () => {
    const testingAppPO = new TestingAppPO();
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
        path: Microfrontend1PagePO.pageUrl,
      },
    });
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-2'},
      properties: {
        path: Microfrontend2PagePO.pageUrl,
      },
    });

    // send message to the activator to navigate to 'microfrontend-1'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-intent');
    await messageClientPO.enterHeaders(new Map().set('qualifier', JSON.stringify({comp: 'microfrontend-1'})));
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'microfrontend-1'
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'microfrontend-2'
    await messageClientPO.enterHeaders(new Map().set('qualifier', JSON.stringify({comp: 'microfrontend-2'})));
    await messageClientPO.clickPublish();

    // expect the primary router outlet to be navigated to 'microfrontend-2'
    await expectRouterOutletUrl(routerOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl}));
  });

  it('should route the specified outlet if in the context of an activator', async () => {
    const testingAppPO = new TestingAppPO();
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
        path: Microfrontend1PagePO.pageUrl,
      },
    });
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-2'},
      properties: {
        path: Microfrontend2PagePO.pageUrl,
      },
    });

    // send message to the activator to navigate to 'microfrontend-1'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-intent');
    await messageClientPO.enterHeaders(new Map()
      .set('outlet', 'secondary')
      .set('qualifier', JSON.stringify({comp: 'microfrontend-1'})));
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expectRouterOutletUrl(primaryRouterOutletPO).toEqual('about:blank');
    // expect the secondary router outlet to be navigated
    await expectRouterOutletUrl(secondaryRouterOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'microfrontend-2'
    await messageClientPO.enterHeaders(new Map()
      .set('outlet', 'secondary')
      .set('qualifier', JSON.stringify({comp: 'microfrontend-2'})));
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expectRouterOutletUrl(primaryRouterOutletPO).toEqual('about:blank');
    // expect the secondary router outlet to be navigated
    await expectRouterOutletUrl(secondaryRouterOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl}));
  });

  it('should route the preferred outlet if in the context of an activator', async () => {
    const testingAppPO = new TestingAppPO();
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
        path: Microfrontend1PagePO.pageUrl,
        outlet: 'secondary'
      },
    });
    await registerCapabilityPO.registerCapability<MicrofrontendCapability>({
      type: 'microfrontend' as any,
      qualifier: {comp: 'microfrontend-2'},
      properties: {
        path: Microfrontend2PagePO.pageUrl,
        outlet: 'secondary'
      },
    });

    // send message to the activator to navigate to 'microfrontend-1'
    const messageClientPO = pagePOs.get<PublishMessagePagePO>('messageClient');
    await messageClientPO.selectFlavor(MessagingFlavor.Topic);
    await messageClientPO.enterTopic('activators/navigate-via-intent');
    await messageClientPO.enterHeaders(new Map().set('qualifier', JSON.stringify({comp: 'microfrontend-1'})));
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expectRouterOutletUrl(primaryRouterOutletPO).toEqual('about:blank');
    // expect the secondary router outlet to be navigated
    await expectRouterOutletUrl(secondaryRouterOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend1PagePO.pageUrl}));

    // repeat the navigation to ensure the activator outlet not to be unloaded

    // send message to the activator to navigate to 'microfrontend-2'
    await messageClientPO.enterHeaders(new Map().set('qualifier', JSON.stringify({comp: 'microfrontend-2'})));
    await messageClientPO.clickPublish();

    // expect the primary router outlet not to be navigated
    await expectRouterOutletUrl(primaryRouterOutletPO).toEqual('about:blank');
    // expect the secondary router outlet to be navigated
    await expectRouterOutletUrl(secondaryRouterOutletPO).toEqual(getPageUrl({origin: TestingAppOrigins.APP_1, path: Microfrontend2PagePO.pageUrl}));
  });
});

async function getPageUrl(parts: {origin: string; path: string}): Promise<string> {
  await browser.switchTo().defaultContent();
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
