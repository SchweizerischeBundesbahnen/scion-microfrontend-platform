/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {$, browser} from 'protractor';
import {BrowserOutletPO, OutletDescriptorTypes, OutletPageObjectClass, OutletPageObjectDescriptor, SwitchToIframeFn} from './browser-outlet/browser-outlet.po';
import {isCssClassPresent, runOutsideAngularSynchronization, waitUntilTestingAppInteractableElseNoop} from './spec.util';

/**
 * The central page object of the testing app to perform the initial navigation.
 */
export class TestingAppPO {

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
   * - must provide a single-arg constructor with an argument of the type {@link SwitchToIframeFn}.
   *   Save that function in the page object and call it when to interact with the page.
   *   It switches the WebDriver execution context, causing Protractor to send future commands to that iframe.
   * - must provide a static readonly field named `pageUrl` initialized with the relative path of its microfrontend.
   *
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
   * export class MicrofrontendPagePO {
   *
   *   public static readonly pageUrl = 'relative/path/to/the/microfrontend';
   *
   *   constructor(private _switchToIframeFn: SwitchToIframeFn) {
   *   }
   *
   *   public async doSomething(): Promise<void> {
   *     await this._switchToIframeFn();
   *
   *     ...
   *   }
   * }
   * ```
   *
   * ### Query params to instrument the 'Testing App':
   * - intentionRegisterApiDisabled:
   *   Provide a comma-separated list of app symbolic names for which to disable the 'Intention Register API'.
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
    await browser.driver.switchTo().defaultContent();
    await browser.driver.get('about:blank');

    // Setup the test case
    const outletPageObjectMap = await this.configureTestingApp(outlets, options);
    await waitUntilTestingAppInteractableElseNoop();
    return outletPageObjectMap;
  }

  private async configureTestingApp(outlets: Outlets, options?: {parentOutletPO?: BrowserOutletPO; queryParams?: Map<string, string>}): Promise<OutletPageObjectMap> {
    const parentOutletPO = options && options.parentOutletPO;
    const queryParams = options && options.queryParams || new Map<string, string>();

    // For root outlets, perform the initial page navigation, for child outlets navigate to the outlets page.
    const outletNames = Object.keys(outlets);

    // Run outside Angular to avoid Protractor from crashing when the app takes long time to initialize, e.g., if activators delay the startup.
    await runOutsideAngularSynchronization(async () => {
      if (parentOutletPO) {
        await parentOutletPO.enterOutletsUrl(TestingAppOrigins.APP_1, outletNames);
      }
      else {
        const queryParamsEncoded = (queryParams.size ? `?${new URLSearchParams([...queryParams]).toString()}` : '');
        await browser.get(`/#/browser-outlets;names=${outletNames.join(',')}${queryParamsEncoded}`);
      }
    });
    await waitUntilTestingAppInteractableElseNoop();

    const browserOutletPOs = outletNames.map(outletName => new BrowserOutletPO(outletName, parentOutletPO));
    const pageObjectMap = new Map<string, any>();

    // Load the microfrontend of every outlet.
    for (const browserOutletPO of browserOutletPOs) {
      const outletDescriptor: string | OutletPageObjectClass | OutletPageObjectDescriptor | Outlets = outlets[browserOutletPO.outletName];

      switch (OutletDescriptorTypes.of(outletDescriptor)) {
        case OutletDescriptorTypes.URL: {
          await browserOutletPO.enterUrl(outletDescriptor as string);
          putIfAbsentOrElseThrow(pageObjectMap, `${browserOutletPO.outletName}`, browserOutletPO);
          break;
        }
        case OutletDescriptorTypes.PAGE_OBJECT_CLASS:
        case OutletDescriptorTypes.PAGE_OBJECT_DESCRIPTOR: {
          const pageObject = await browserOutletPO.enterUrl<any>(outletDescriptor as OutletPageObjectClass | OutletPageObjectDescriptor);
          putIfAbsentOrElseThrow(pageObjectMap, `${browserOutletPO.outletName}:outlet`, browserOutletPO);
          putIfAbsentOrElseThrow(pageObjectMap, browserOutletPO.outletName, pageObject);
          break;
        }
        case OutletDescriptorTypes.OUTLETS: {
          putIfAbsentOrElseThrow(pageObjectMap, browserOutletPO.outletName, browserOutletPO);
          const pageObjects = await this.configureTestingApp(outletDescriptor as Outlets, {parentOutletPO: browserOutletPO});
          pageObjects.outlets().forEach(outlet => putIfAbsentOrElseThrow(pageObjectMap, outlet, pageObjects.get(outlet)));
          break;
        }
      }
    }

    return new class implements OutletPageObjectMap {

      public outlets(): string[] {
        return Array.from(pageObjectMap.keys());
      }

      public get<T>(outlet: string): T {
        const pageObject = pageObjectMap.get(outlet) as T;
        if (!pageObject) {
          throw Error(`[OutletNotFoundError] No outlet found with the given name '${outlet}'.`);
        }
        return pageObject;
      }
    };
  }

  /**
   * Returns `true` if the document in the specified iframe or its embedded web content has received focus, or `false` if not.
   *
   * If not specifying a 'switchTo' function, the root context is checked if it has the focus.
   */
  public async isFocusWithin(switchToIframeFn?: SwitchToIframeFn): Promise<boolean> {
    if (switchToIframeFn) {
      await switchToIframeFn();
    }
    else {
      await browser.switchTo().defaultContent();
    }

    return $('app-root').$('.e2e-focus-within').isPresent();
  }

  /**
   * Returns `true` if the devtools is present in the current configuration.
   */
  public async isDevtoolsEnabled(): Promise<boolean> {
    await browser.switchTo().defaultContent();
    return isCssClassPresent($('app-shell'), 'e2e-devtools-enabled');
  }
}

function putIfAbsentOrElseThrow(map: Map<string, any>, outletName: string, pageObject: any): void {
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
  [outletName: string]: OutletPageObjectClass | OutletPageObjectDescriptor | Outlets | string;
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
  get<T>(outlet: string): T;
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
