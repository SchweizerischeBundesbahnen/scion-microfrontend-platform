/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {FrameLocator, Page} from '@playwright/test';
import {BrowserOutletPO, OutletDescriptorTypes, OutletPageObject, OutletPageObjectConstructor, OutletPageObjectDescriptor} from './browser-outlet/browser-outlet.po';
import {isPresent} from './testing.util';
import {ElementSelectors} from './element-selectors';

/**
 * The central page object of the testing app to perform the initial navigation.
 */
export class TestingAppPO {

  constructor(private readonly _page: Page) {
  }

  /**
   * Navigates to the testing app with a given microfrontend setup.
   *
   * A microfrontend is displayed inside an outlet. Multiple outlets can be configured, allowing to test multiple microfrontends in a single page.
   * Outlets can be nested. Each outlet must be given a unique name and a page object class representing the microfrontend.
   * To load a microfrontend from a different origin than from 'http://localhost:4201', also specify the origin of the microfrontend.
   *
   * This method returns a {@link OutletPageObjectMap}. Call {@link OutletPageObjectMap#get} with the microfrontend's outlet name to get a
   * reference to the page object of that microfrontend. To get a reference to the containing outlet, append the outlet name with the suffix ':outlet'.
   *
   * A page object class must meet the following requirements:
   * - must implement the interface {@link OutletPageObject}.
   * - must provide a single-arg constructor with an argument of the type {@link FrameLocator}.
   *   Use the frame locator to access elements, such as buttons, inputs, etc. on your microfrontend.
   *
   * ## Examples:
   *
   * ### Microfrontend configuration:
   *
   * ```
   * const pagePOs = await testingAppPO.navigateTo({
   *   left: LeftPagePO,
   *   middle: {
   *     main: MainPagePO,
   *     panel: {origin: TestingAppOrigins.APP_2, useClass: PanelPagePO},
   *   },
   *   right: RightPagePO,
   * });
   *
   * const leftPagePO = pagePOs.get<PublishMessagePagePO>('left');
   * const mainPagePO = pagePOs.get<PublishMessagePagePO>('main');
   * ```
   *
   * ### Page object class:
   *
   * ```
   * export class MicrofrontendPagePO implements OutletPageObject {
   *
   *   public readonly path = 'path/to/the/microfrontend';
   *   private readonly _locator: Locator;
   *
   *   constructor(frameLocator: FrameLocator) {
   *     this._locator = frameLocator.locator('app-page-selector');
   *   }
   *
   *   public async doSomething(): Promise<void> {
   *     this._locator.locator('input').fill('some text');
   *   }
   * }
   * ```
   *
   * ### Query params to instrument the 'Testing App':
   * - intentionRegisterApiDisabled:
   *   Provide a comma-separated list of app symbolic names for which to disable the 'Intention Register API'.
   * - capabilityActiveCheckDisabled:
   *   Provide a comma-separated list of app symbolic names for which to disable the 'Capability Active Check'.
   * - manifestClassifier:
   *   Control which manifest files to collect by providing a classifier which is appended to the manifest filename.
   *   E.g. if setting the classifier 'activator', the manifest 'app-1-manifest-activator.json' is collected instead of 'app-1-manifest.json'.
   * - activatorApiDisabled:
   *   Controls if the 'Activator API' is disabled.
   * - intercept-message:reject
   *   Messages sent to the specified topic are rejected
   * - intercept-message:swallow
   *   Messages sent to the specified topic are swallowed
   * - intercept-message:uppercase
   *   The message body of messages sent to the specified topic are changed to all upper case characters
   * - intercept-intent:reject
   *   Intents of the specified type are rejected
   * - intercept-intent:swallow
   *   Intents of the specified type are swallowed
   * - intercept-intent:uppercase
   *   The intent body of intents having the specified intent type are changed to all upper case characters
   *
   * @param outlets describes which microfrontends to load.
   * @param options controls the navigation
   * @return `OutletPageObjectMap` to get the page object for an outlet.
   */
  public async navigateTo(outlets: Outlets, options?: {queryParams?: Map<string, string>}): Promise<OutletPageObjectMap> {
    // Navigate to the 'about:blank' page before setting up the test case to have a clean application state.
    await this._page.goto('about:blank');

    // Setup the test case
    const queryParams = options?.queryParams ?? new Map<string, string>();

    // Do not register DevTools.
    queryParams.set('devtools', 'false');

    const queryParamsEncoded = (queryParams.size ? `?${new URLSearchParams([...queryParams]).toString()}` : '');
    await this._page.goto(`/#/browser-outlets;names=${Object.keys(outlets).join(',')}${queryParamsEncoded}`);
    // Wait until started the host app.
    await this._page.locator('*[ng-version]').waitFor({state: 'attached'});

    return this.configureTestingApp(outlets, this._page);
  }

  private async configureTestingApp(outlets: Outlets, locator: Page | FrameLocator): Promise<OutletPageObjectMap> {
    const outletPageObjectMap = new Map<string, OutletPageObject>();
    for (const outletName of Object.keys(outlets)) {
      const outletDescriptor: string | OutletPageObjectConstructor | OutletPageObjectDescriptor | Outlets = outlets[outletName]!;

      const browserOutletPO = new BrowserOutletPO(locator, outletName);

      switch (OutletDescriptorTypes.of(outletDescriptor)) {
        case OutletDescriptorTypes.URL: {
          await browserOutletPO.enterUrl(outletDescriptor as string);
          putIfAbsentOrElseThrow(outletPageObjectMap, outletName, browserOutletPO);
          break;
        }
        case OutletDescriptorTypes.PAGE_OBJECT_CLASS:
        case OutletDescriptorTypes.PAGE_OBJECT_DESCRIPTOR: {
          const pageObject = await browserOutletPO.enterUrl(outletDescriptor as OutletPageObjectConstructor | OutletPageObjectDescriptor);
          putIfAbsentOrElseThrow(outletPageObjectMap, `${outletName}:outlet`, browserOutletPO);
          putIfAbsentOrElseThrow(outletPageObjectMap, outletName, pageObject);
          break;
        }
        case OutletDescriptorTypes.OUTLETS: {
          const childOutlets = outletDescriptor as Outlets;
          await browserOutletPO.enterOutletsUrl(TestingAppOrigins.APP_1, Object.keys(childOutlets));
          const pageObjects = await this.configureTestingApp(childOutlets, locator.frameLocator(ElementSelectors.routerOutletFrame(outletName)));
          pageObjects.outlets().forEach(outlet => putIfAbsentOrElseThrow(outletPageObjectMap, outlet, pageObjects.get(outlet)));
          putIfAbsentOrElseThrow(outletPageObjectMap, outletName, browserOutletPO);
          break;
        }
      }
    }

    return new class implements OutletPageObjectMap {

      public outlets(): string[] {
        return Array.from(outletPageObjectMap.keys());
      }

      public get<T extends OutletPageObject>(outlet: string): T {
        const pageObject = outletPageObjectMap.get(outlet) as T | undefined;
        if (!pageObject) {
          throw Error(`[OutletNotFoundError] No outlet found with the given name '${outlet}'.`);
        }
        return pageObject;
      }
    }();
  }

  /**
   * Returns `true` if the testing app or any descendant element has received focus, or `false` if not.
   */
  public async isFocusWithin(): Promise<boolean> {
    return isPresent(this._page.locator('app-root').locator('.e2e-focus-within'));
  }

  /**
   * Returns `true` if the testing app has received focus, or `false` if not.
   */
  public async hasFocus(): Promise<boolean> {
    return isPresent(this._page.locator('app-root').locator('.e2e-has-focus'));
  }
}

function putIfAbsentOrElseThrow(map: Map<string, OutletPageObject>, outletName: string, pageObject: OutletPageObject): void {
  if (map.has(outletName)) {
    throw Error(`[OutletUniqueError] Another outlet already registered under the same name. [outlet=${outletName}]`);
  }
  map.set(outletName, pageObject);
}

/**
 * Describes which microfrontends to load.
 *
 * Add an entry to this dictionary for every microfrontend to load. The key is used as the outlet name. Outlets can be nested.
 * An outlet specifies the page object class which represents the microfrontend. If only specifying the page object class,
 * the microfrontend is loaded from the origin 'http://localhost:4201'. To load a microfrontend from a different origin, use
 * a {@link OutletPageObjectDescriptor} object to configure the microfrontend instead.
 */
export interface Outlets {
  [outletName: string]: OutletPageObjectConstructor | OutletPageObjectDescriptor | Outlets | string;
}

/**
 * Allows getting the page object for an outlet.
 */
export interface OutletPageObjectMap {

  /** @internal */
  outlets(): string[];

  /**
   * Returns the page object for the given outlet, or throws an error if not found.
   */
  get<T extends OutletPageObject>(outlet: string): T;
}

/**
 * Origins under which the testing app is served.
 */
export enum TestingAppOrigins {
  APP_1 = 'http://localhost:4201',
  APP_2 = 'http://localhost:4202',
  APP_3 = 'http://localhost:4203',
  APP_4 = 'http://localhost:4204',
}
