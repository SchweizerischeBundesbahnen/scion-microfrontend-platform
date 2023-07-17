/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Outlets, TestingAppOrigins} from '../testing-app.po';
import {RouterOutletContextPO} from '../context/router-outlet-context.po';
import {Frame, FrameLocator, Locator, Page} from '@playwright/test';
import {getLocationHref, isPresent, parseKeystroke} from '../testing.util';
import {ElementSelectors} from '../element-selectors';
import {RouterOutletSettingsPO} from '../settings/router-outlet-settings.po';
import {ConsoleLogs} from '../console-logs';

/**
 * Page object for {@link BrowserOutletComponent} to show a microfrontend in an iframe inside `<sci-router-outlet>`.
 */
export class BrowserOutletPO implements OutletPageObject {

  public readonly path = 'browser-outlets';

  private readonly _locator: Locator;
  private readonly _outletFrame: Promise<Frame>;

  constructor(private readonly _pageOrFrameLocator: Page | FrameLocator, private outletName: string) {
    const page = this._pageOrFrameLocator.locator('html').page();
    this._locator = this._pageOrFrameLocator.locator(`app-browser-outlet`, {has: page.locator(ElementSelectors.routerOutlet(outletName))});
    this._outletFrame = this.resolveOutletFrame(outletName, {timeout: 5000});
  }

  /**
   * Loads the given site into the outlet's iframe.
   *
   * @param command the target of the microfrontend; can be either a URL in the form of a {@link string}, a {@link OutletPageObjectConstructor} or a {@link OutletPageObjectDescriptor}.
   * @return Promise which resolves to the page object instance. If given a URL, the promise resolves to `undefined`.
   */
  public async enterUrl<T extends OutletPageObject | never>(command: string | OutletPageObjectConstructor | OutletPageObjectDescriptor): Promise<T> {
    switch (OutletDescriptorTypes.of(command)) {
      case OutletDescriptorTypes.URL: {
        await this.enterUrlAndNavigate(command as string);
        return undefined;
      }
      case OutletDescriptorTypes.PAGE_OBJECT_CLASS: {
        const clazz = command as OutletPageObjectConstructor<T>;
        const instance = new clazz(this.routerOutletFrameLocator);
        await this.enterUrlAndNavigate(new URL(`#/${instance.path}`, TestingAppOrigins.APP_1).toString());
        return instance;
      }
      case OutletDescriptorTypes.PAGE_OBJECT_DESCRIPTOR: {
        const {useClass: clazz, origin} = command as OutletPageObjectDescriptor<T>;
        const instance = new clazz(this.routerOutletFrameLocator);
        await this.enterUrlAndNavigate(new URL(`#/${instance.path}`, origin).toString());
        return instance;
      }
      default: {
        throw Error('[OutletNavigateError] Outlet navigation failed because entered an invalid command object. Supported command objects are: URL in the form of a string, `OutletPageObjectClass` or `OutletDescriptor`.');
      }
    }
  }

  /**
   * Loads the site 'browser-outlets' into the outlet's iframe to show nested microfrontend(s).
   *
   * @param origin
   *        the origin from where to load 'browser-outlets' page
   * @param outletNames
   *        list of outlets for which to create an outlet. Each outlet has an iframe to show some microfrontend.
   */
  public async enterOutletsUrl(origin: string, outletNames: string[]): Promise<void> {
    await this.enterUrl(new URL(`#/${this.path};names=${outletNames.join(',')}`, origin).toString());
  }

  /**
   * Displays the context of the <sci-router-outlet> contained in this browser outlet.
   */
  public async openRouterOutletContext(): Promise<RouterOutletContextPO> {
    await this._locator.locator('button.e2e-context-define').click();
    return new RouterOutletContextPO(this._pageOrFrameLocator);
  }

  /**
   * Displays the settings of the <sci-router-outlet> contained in this browser outlet.
   */
  public async openRouterOutletSettings(): Promise<RouterOutletSettingsPO> {
    await this._locator.locator('button.e2e-settings').click();
    return new RouterOutletSettingsPO(this._pageOrFrameLocator);
  }

  /**
   * Focuses the URL field.
   */
  public async focusUrl(): Promise<void> {
    await this._locator.locator('input.e2e-url').focus();
  }

  /**
   * Returns `true` if the embedded web content or any descendant element has received focus, or `false` if not.
   */
  public async isFocusWithinIframe(): Promise<boolean> {
    return isPresent(this.routerOutletFrameLocator.locator('app-root').locator('.e2e-focus-within'));
  }

  public get routerOutletFrameLocator(): FrameLocator {
    return this._locator.frameLocator(ElementSelectors.routerOutletFrame());
  }

  /**
   * Returns the URL of embedded content by invoking `location.href`.
   */
  public getEmbeddedContentUrl(): Promise<string> {
    return getLocationHref(this.routerOutletFrameLocator);
  }

  /**
   * Instructs embedded content to propagate keyboard events for the given keystrokes.
   *
   * Keystrokes can be registered either via attribute in the HTML template, or via property on the DOM element.
   */
  public async registerKeystrokes(keystrokes: string[], options: {registration: 'ATTR' | 'DOM'}): Promise<void> {
    const consoleLogs = new ConsoleLogs(this._locator.page());
    const sciRouterOutletLocator = this._locator.locator(ElementSelectors.routerOutlet());
    try {
      switch (options.registration) {
        // Register keystrokes via 'keystrokes' attribute in the HTML template.
        case 'ATTR': {
          const pageFunction = (element, argument): void => element.setAttribute('keystrokes', argument);
          await sciRouterOutletLocator.evaluate(pageFunction, keystrokes.join(','));
          break;
        }
        // Register keystrokes via 'keystrokes' property on the DOM element.
        case 'DOM': {
          const pageFunction = (element, argument): void => void (element['keystrokes'] = argument);
          await sciRouterOutletLocator.evaluate(pageFunction, keystrokes);
          break;
        }
        default: {
          throw Error(`[IllegalArgumentError] Expected registration to be one of ['ATTR', 'DOM'], but was '${options.registration}'`);
        }
      }

      // Wait for the keystrokes to be installed in the embedded microfrontend.
      for (const keystroke of keystrokes) {
        await consoleLogs.get({
          severity: 'debug',
          filter: new RegExp(`\\[AppShellComponent::keystroke:${parseKeystroke(keystroke).parts}.*?].*\\[outlet=${this.outletName}]`),
        });
      }
    }
    finally {
      consoleLogs.dispose();
    }
  }

  private async enterUrlAndNavigate(url: string): Promise<void> {
    const outletFrame = await this._outletFrame;

    await this._locator.locator('input.e2e-url').fill(url);
    await Promise.all([
      this._locator.locator('button.e2e-go').click(),
      outletFrame.waitForURL(url),
    ]);
  }

  /**
   * Resolves to the frame contained in the <sci-router-outlet> element.
   */
  private async resolveOutletFrame(outletName: string, options: {timeout: number}): Promise<Frame> {
    // - Playwright does not provide API to find an iframe by name if its name is set after it is created.
    //   For this reason we need to iterate all iframes to find it.
    // - The invocation of the `Page.frames` method does not interact with the browser to get iframes. Therefore,
    //   the iframes returned may differ from the actual iframes because Playwright synchronizes them asynchronously.
    //   For this reason, we repeat finding the iframe repeatedly until it is either found or the specified timeout
    //   elapses.
    const expiration = Date.now() + options.timeout;
    const page = this._locator.page();
    do {
      for (const frame of page.frames()) {
        if (frame === page.mainFrame()) {
          continue; // skip the main browser frame
        }

        if (outletName === await (await frame.frameElement()).getAttribute('name')) {
          return frame;
        }
      }
      await page.waitForTimeout(10);
    } while (Date.now() < expiration);

    throw Error(`[NullFrameError] Frame with name '${outletName}' not found.`);
  }
}

/**
 * Contract that a page object must implement in order to be used as outlet in the test setup.
 *
 * - must provide a single-arg constructor with an argument of the type {@link FrameLocator}. See {@link OutletPageObjectConstructor}.
 *   Use the frame locator to access elements, such as buttons, inputs, etc. on your microfrontend.
 * - must provide a readonly field named `path` initialized with the path to the page.
 *
 * @see OutletPageObjectConstructor
 */
export interface OutletPageObject {
  /**
   * Specifies the path to the page.
   */
  readonly path: string;
}

/**
 * Required constructor of a page object in order to be used as outlet in the test setup.
 */
export interface OutletPageObjectConstructor<T extends OutletPageObject = OutletPageObject> extends Function {
  new(frameLocator: FrameLocator): T;
}

/**
 * Describes the microfrontend to load in an outlet.
 */
export interface OutletPageObjectDescriptor<T extends OutletPageObject = OutletPageObject> {
  /**
   * Origin of the microfrontend.
   */
  origin: string;
  /**
   * Page object class which represents the microfrontend.
   */
  useClass: OutletPageObjectConstructor<T>;
}

/**
 * Represents types of outlet descriptors.
 */
export namespace OutletDescriptorTypes {

  export const URL = 'url';
  export const PAGE_OBJECT_CLASS = 'pageObjectClass';
  export const PAGE_OBJECT_DESCRIPTOR = 'pageObjectDescriptor';
  export const OUTLETS = 'outlets';

  /**
   * Resolves the given descriptor to its type.
   */
  export function of(descriptor: string | OutletPageObjectConstructor | OutletPageObjectDescriptor | Outlets): string {
    if (typeof descriptor === 'string') {
      return URL;
    }
    else if (typeof descriptor === 'function') {
      return PAGE_OBJECT_CLASS;
    }
    else if (descriptor.origin && descriptor.useClass) {
      return PAGE_OBJECT_DESCRIPTOR;
    }
    return OUTLETS;
  }
}
