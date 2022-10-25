/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {FrameLocator, Locator, Page} from '@playwright/test';
import {SciCheckboxPO} from '../components.internal/checkbox.po/checkbox.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';
import {waitUntilStable} from '../testing.util';
import {Objects} from '../@scion/toolkit/util/objects.util';

export class PreferredSizePagePO implements OutletPageObject {

  public static readonly PATH = 'preferred-size';
  public readonly path = PreferredSizePagePO.PATH;

  private readonly _locator: Locator;

  constructor(pageOrFrameLocator: Page | FrameLocator) {
    this._locator = pageOrFrameLocator.locator('app-preferred-size');
  }

  public async enterCssWidth(width: string): Promise<void> {
    await this._locator.locator('input.e2e-css-width').fill(width);
    await this._locator.locator('input.e2e-css-width').press('Tab'); // press 'tab' for the value to be applied
  }

  public async enterCssHeight(height: string): Promise<void> {
    await this._locator.locator('input.e2e-css-height').fill(height);
    await this._locator.locator('input.e2e-css-height').press('Tab'); // press 'tab' for the value to be applied
  }

  public async enterPreferredWidth(width: string | null): Promise<void> {
    await this._locator.locator('input.e2e-preferred-width').fill(width ?? '');
    await this._locator.locator('input.e2e-preferred-width').press('Tab'); // press 'tab' for the value to be applied
  }

  public async enterPreferredHeight(height: string | null): Promise<void> {
    await this._locator.locator('input.e2e-preferred-height').fill(height ?? '');
    await this._locator.locator('input.e2e-preferred-height').press('Tab'); // press 'tab' for the value to be applied
  }

  public async checkUseElementSize(check: boolean): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-use-element-size')).toggle(check);
  }

  public async clickReset(): Promise<void> {
    await this._locator.locator('button.e2e-reset').click();
  }

  public async clickBindElementObservable(): Promise<void> {
    await this._locator.locator('button.e2e-bind-element-observable').click();
  }

  public async clickUnbindElementObservable(): Promise<void> {
    await this._locator.locator('button.e2e-unbind-element-observable').click();
  }

  public async clickUnmount(): Promise<void> {
    await this._locator.locator('button.e2e-unmount').click();
  }

  /**
   * Returns the size of this component.
   */
  public async getSize(): Promise<Size> {
    const boundingBox = await waitUntilStable(() => this._locator.boundingBox(), {isStable: Objects.isEqual});
    return {
      width: boundingBox?.width ?? 0,
      height: boundingBox?.height ?? 0,
    };
  }
}

export interface Size {
  width: number;
  height: number;
}
