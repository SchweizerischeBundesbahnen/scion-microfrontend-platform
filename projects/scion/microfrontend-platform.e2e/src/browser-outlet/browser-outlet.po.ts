/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { $, browser, ElementFinder, WebElement } from 'protractor';
import { enterText, getUrlOfCurrentWebDriverExecutionContext, runOutsideAngularSynchronization, setAttribute, switchToIframe, waitUntilLocation } from '../spec.util';
import { UUID } from '@scion/toolkit/uuid';
import { Outlets, TestingAppOrigins, TestingAppPO } from '../testing-app.po';
import { RouterOutletContextPO } from '../context/router-outlet-context.po';
import { RouterOutletSettingsPO } from '../settings/router-outlet-settings.po';

/**
 * Page object for {@link BrowserOutletComponent} to show a microfrontend in an iframe inside `<sci-router-outlet>`.
 */
export class BrowserOutletPO {

  private static ATTR_WEBDRIVER_EXECUTION_CONTEXT_ID = 'webdriverExecutionContextId';

  private readonly _outletFinder: ElementFinder;
  private _url: string;

  /**
   * Unique iframe identity to determine if to switch the WebDriver execution context when interacting with the iframe.
   * The identity is computed and set when interacting with the iframe for the first time.
   */
  private _webdriverExecutionContextId: string;

  /**
   * Allows defining the context of this outlet.
   */
  public readonly outletContextPO: RouterOutletContextPO;

  /**
   * Allows configuring the settings of this outlet.
   */
  public readonly outletSettingsPO: RouterOutletSettingsPO;

  constructor(public outletName: string, private _parentOutletPO?: BrowserOutletPO) {
    this._outletFinder = $(`app-browser-outlet#${this.outletName}`);
    this.outletContextPO = new RouterOutletContextPO(this._outletFinder, (): Promise<void> => this.switchToOutlet());
    this.outletSettingsPO = new RouterOutletSettingsPO(this._outletFinder, (): Promise<void> => this.switchToOutlet());
  }

  /**
   * Loads the given site into the outlet's iframe.
   *
   * @param command the target of the microfrontend; can be either a URL in the form of a {@link string}, a {@link OutletPageObjectClass} or a {@link OutletPageObjectDescriptor}.
   * @return Promise which resolves to the page object instance. If given a URL, the promise resolves to `undefined`.
   */
  public async enterUrl<T = void>(command: string | OutletPageObjectClass | OutletPageObjectDescriptor): Promise<T> {
    switch (OutletDescriptorTypes.of(command)) {
      case OutletDescriptorTypes.URL: {
        await this.enterUrlAndNavigate(command as string);
        return undefined;
      }
      case OutletDescriptorTypes.PAGE_OBJECT_CLASS: {
        const pageObjectClass = command as OutletPageObjectClass;
        await this.enterUrlAndNavigate(new URL(`#/${pageObjectClass.pageUrl}`, TestingAppOrigins.APP_1).toString());
        return new pageObjectClass((): Promise<void> => this.switchToOutletIframe(true));
      }
      case OutletDescriptorTypes.PAGE_OBJECT_DESCRIPTOR: {
        const {useClass, origin} = command as OutletPageObjectDescriptor;
        await this.enterUrlAndNavigate(new URL(`#/${useClass.pageUrl}`, origin).toString());
        return new useClass((): Promise<void> => this.switchToOutletIframe(true));
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
    await this.enterUrl(new URL(`#/browser-outlets;names=${outletNames.join(',')}`, origin).toString());
  }

  /**
   * Switches the WebDriver execution context to this outlet. When resolved,
   * future Protractor commands are sent to this outlet.
   *
   * Elements contained within iframes can not be accessed from inside the root execution context.
   * Instead, the execution context must first be switched to the iframe.
   */
  public async switchToOutlet(): Promise<void> {
    if (await this._outletFinder.isPresent()) {
      return; // WebDriver execution context for this iframe is already active
    }

    if (!this._parentOutletPO) {
      await browser.switchTo().defaultContent();
      console.log('Switched WebDriver execution context to the root page.');
    }
    else {
      await this._parentOutletPO.switchToOutletIframe();
    }
  }

  /**
   * Switches the WebDriver execution context to the iframe of this outlet. When resolved,
   * future Protractor commands are sent to that iframe.
   *
   * Elements contained within iframes can not be accessed from inside the root execution context.
   * Instead, the execution context must first be switched to the iframe.
   */
  public async switchToOutletIframe(trace: boolean = true): Promise<void> {
    // Do not wait for Angular as the page must not necessarily be an Angular page, e.g. 'about:blank'.
    await runOutsideAngularSynchronization(async () => {
      // Check if the WebDriver execution context for this document is already active.
      if (this._webdriverExecutionContextId
        && this._webdriverExecutionContextId === await $('body').getAttribute(BrowserOutletPO.ATTR_WEBDRIVER_EXECUTION_CONTEXT_ID)
        && this._url === await getUrlOfCurrentWebDriverExecutionContext()) {
        return Promise.resolve();
      }

      // In order to activate this iframe's WebDriver execution context, its parent iframe execution contexts must be activated first,
      // one by one, starting with the root context.
      if (!this._parentOutletPO) {
        await browser.switchTo().defaultContent();
        trace && console.log('Switched WebDriver execution context to the root page.');
      }
      else {
        await this._parentOutletPO.switchToOutletIframe(false);
      }

      // Get the iframe from the custom element (inside shadow DOM)
      const iframe = await browser.executeScript('return arguments[0].iframe', this._outletFinder.$('sci-router-outlet').getWebElement()) as WebElement;

      // Activate this iframe's WebDriver execution context.
      await switchToIframe(iframe);
      await waitUntilLocation(this._url);
      trace && console.log(`Switched WebDriver execution context to the iframe: ${this.iframePath.join(' > ')}. [${this._url}}`);

      // Set the webdriver execution context identity as attribute to the document's body element (if not already set).
      // It will be used by later interactions to decide if a context switch is required.
      if (!this._webdriverExecutionContextId) {
        this._webdriverExecutionContextId = UUID.randomUUID();
        await setAttribute($('body'), BrowserOutletPO.ATTR_WEBDRIVER_EXECUTION_CONTEXT_ID, this._webdriverExecutionContextId);
      }
    });
  }

  /**
   * Clicks the URL field to gain focus.
   */
  public async clickUrl(): Promise<void> {
    await this.switchToOutlet();
    await this._outletFinder.$('input.e2e-url').click();
  }

  /**
   * Returns `true` if the embedded web content or any descendant element has received focus, or `false` if not.
   */
  public async isFocusWithinIframe(): Promise<boolean> {
    return new TestingAppPO().isFocusWithin(() => this.switchToOutletIframe());
  }

  /**
   * Instructs embedded content to propagate keyboard events for the given keystrokes.
   * The keystrokes are set to the 'keystrokes' attribute in the HTML template.
   */
  public async setKeystrokesViaAttr(keystrokes: string): Promise<void> {
    await this.switchToOutlet();
    await setAttribute(this._outletFinder.$('sci-router-outlet'), 'keystrokes', keystrokes);
  }

  /**
   * Instructs embedded content to propagate keyboard events for the given keystrokes.
   * The keystrokes are set to the 'keystrokes' property in the DOM element.
   */
  public async setKeystrokesViaDom(keystrokes: string[]): Promise<void> {
    await this.switchToOutlet();
    await browser.executeScript('arguments[0].keystrokes = arguments[1];', this._outletFinder.$('sci-router-outlet').getWebElement(), keystrokes);
  }

  private get iframePath(): string[] {
    const iframeIdentity = this.outletName;

    if (this._parentOutletPO) {
      return this._parentOutletPO.iframePath.concat(iframeIdentity);
    }
    return [iframeIdentity];
  }

  private async enterUrlAndNavigate(url: string): Promise<void> {
    await this.switchToOutlet();

    this._url = url;
    await enterText(url, this._outletFinder.$('input.e2e-url'));
    await this._outletFinder.$('button.e2e-go').click();
  }
}

/**
 * Declares the minimal requirements of a page object class used as an outlet.
 */
export interface OutletPageObjectClass extends Function {
  pageUrl: string;

  new(switchToIframeFn: SwitchToIframeFn): any; // tslint:disable-line:callable-types
}

/**
 * Describes the microfrontend to load in an outlet.
 */
export interface OutletPageObjectDescriptor {
  /**
   * Origin of the microfrontend.
   */
  origin: string;
  /**
   * Page object class which represents the microfrontend.
   */
  useClass: OutletPageObjectClass;
}

/**
 * Switches the WebDriver execution context, causing Protractor to send future commands to that iframe.
 */
export declare type SwitchToIframeFn = () => Promise<void>;

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
  export function of(descriptor: string | OutletPageObjectClass | OutletPageObjectDescriptor | Outlets): string {
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
