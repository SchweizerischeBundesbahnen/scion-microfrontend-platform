/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {getLocationHref, isCssClassPresent, isPresent, setLocationHref, waitUntilNavigationStable, waitUntilStable} from '../testing.util';
import {RouterOutletSettingsPO} from '../settings/router-outlet-settings.po';
import {FrameLocator, Locator} from '@playwright/test';
import {ElementSelectors} from '../element-selectors';
import {RouterOutletContextPO} from '../context/router-outlet-context.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';
import {Objects} from '../@scion/toolkit/util';

export class RouterOutletPagePO implements OutletPageObject {

  public static readonly PATH = 'router-outlet';
  public readonly path = RouterOutletPagePO.PATH;

  private readonly _locator: Locator;
  private readonly _routerOutletFrameLocator: FrameLocator;

  constructor(private readonly _frameLocator: FrameLocator) {
    this._locator = this._frameLocator.locator('app-router-outlet');
    this._routerOutletFrameLocator = this._locator.frameLocator(ElementSelectors.routerOutletFrame());
  }

  public async enterOutletName(outlet: string): Promise<void> {
    await this._locator.locator('input.e2e-outlet-name').fill(outlet);
  }

  public async clickApply(): Promise<void> {
    await this._locator.locator('button.e2e-apply').click();
    await waitUntilNavigationStable(this._locator.page());
  }

  /**
   * Returns the URL of embedded content by invoking `location.href`.
   */
  public getEmbeddedContentUrl(): Promise<string> {
    return getLocationHref(this._routerOutletFrameLocator);
  }

  /**
   * Sets the URL in the browsing context of embedded content by invoking `location.href`.
   */
  public async setEmbeddedContentUrl(url: string): Promise<void> {
    await setLocationHref(this._routerOutletFrameLocator, url);
  }

  /**
   * Returns the size of the router outlet.
   */
  public async getRouterOutletSize(): Promise<Size> {
    const boundingBox = await waitUntilStable(() => this._locator.locator('sci-router-outlet').boundingBox(), {isStable: Objects.isEqual});
    return {
      width: boundingBox?.width ?? 0,
      height: boundingBox?.height ?? 0,
    };
  }

  /**
   * Returns the name of the router outlet.
   */
  public getRouterOutletName(): Promise<string> {
    return this._locator.locator(ElementSelectors.routerOutlet()).getAttribute('name');
  }

  /**
   * Returns the name of the iframe of the router outlet.
   */
  public getRouterOutletFrameName(): Promise<string> {
    return this._locator.locator(ElementSelectors.routerOutletFrame()).getAttribute('name');
  }

  /**
   * Returns `true` if the outlet is showing no content, or `false` otherwise.
   */
  public async isEmpty(): Promise<boolean> {
    const isEmpty = await isPresent(this._locator.locator('div.e2e-empty'));
    const isEmptyCssClassPresent = await isCssClassPresent(this._locator.locator('sci-router-outlet'), 'sci-empty');

    if (isEmpty !== isEmptyCssClassPresent) {
      throw Error(`[IllegalStateError] Expected CSS class 'sci-empty' on 'sci-router-outlet' HTML element to by in sync with the empty property on the 'SciRouterOutletElement' DOM element [emptyProperty=${isEmpty}, cssClassPresent=${isEmptyCssClassPresent}]`);
    }
    return isEmpty;
  }

  /**
   * Displays the context of the <sci-router-outlet> contained in this router outlet.
   */
  public async openRouterOutletContext(): Promise<RouterOutletContextPO> {
    await this._locator.locator('button.e2e-context-define').click();
    return new RouterOutletContextPO(this._frameLocator);
  }

  /**
   * Displays the settings of the <sci-router-outlet> contained in this router outlet.
   */
  public async openRouterOutletSettings(): Promise<RouterOutletSettingsPO> {
    await this._locator.locator('button.e2e-settings').click();
    return new RouterOutletSettingsPO(this._frameLocator);
  }

  /**
   * Reference to the {@link FrameLocator} of the <sci-router-outlet> contained in this router outlet.
   */
  public get routerOutletFrameLocator(): FrameLocator {
    return this._routerOutletFrameLocator;
  }
}

export interface Size {
  width: number;
  height: number;
}
