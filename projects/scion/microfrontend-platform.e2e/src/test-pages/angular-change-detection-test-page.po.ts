/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {FrameLocator, Locator} from '@playwright/test';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';
import {isPresent, waitUntilStable} from '../testing.util';

export class AngularChangeDetectionTestPagePO implements OutletPageObject {

  public readonly path = 'test-pages/angular-change-detection-test-page';

  private readonly _locator: Locator;

  constructor(private _frameLocator: FrameLocator) {
    this._locator = this._frameLocator.locator('app-angular-change-detection-test-page');
  }

  public async hasFocus(): Promise<boolean> {
    return isPresent(this._frameLocator.locator('app-root').locator('.e2e-has-focus'));
  }

  /**
   * Moves the mouse cursor to the center of the element, applying given offset.
   */
  public async moveMouseToElement(options?: {steps?: number; offsetX?: number; offsetY?: number}): Promise<void> {
    const locator = this._locator.locator('div.e2e-element');
    const {x, y, width, height} = await locator.boundingBox();
    const center = {x: x + width / 2, y: y + height / 2};
    await this._locator.page().mouse.move(center.x + (options?.offsetX ?? 0), center.y + (options?.offsetY ?? 0), {steps: options?.steps});
  }

  /**
   * Moves the mouse cursor to the center of this page, applying given offset.
   */
  public async moveMouseToCenter(offset?: {x?: number; y?: number}): Promise<void> {
    const {x, y, width, height} = await this._locator.boundingBox();
    const center = {x: x + width / 2, y: y + height / 2};
    await this._locator.page().mouse.move(center.x + (offset?.x ?? 0), center.y + (offset?.y ?? 0), {steps: 1});
  }

  /**
   * Clicks into the center of this page.
   */
  public async clickCenter(): Promise<void> {
    const {x, y, width, height} = await this._locator.boundingBox();
    const center = {x: x + width / 2, y: y + height / 2};
    await this._locator.page().mouse.click(center.x, center.y);
  }

  /**
   * Presses the mouse button at the current mouse position.
   */
  public async mouseDown(): Promise<void> {
    await this._locator.page().mouse.down();
  }

  /**
   * Releases the mouse button at the current mouse position.
   */
  public async mouseUp(): Promise<void> {
    await this._locator.page().mouse.up();
  }

  /**
   * Types given text into the text area of the change detection log.
   */
  public async type(text: string): Promise<void> {
    await this._locator.locator('textarea.e2e-angular-change-detection-cycles').focus();
    await this._locator.page().keyboard.type(text);
  }

  /**
   * Clears the change detection log without triggering a change detection cycle.
   */
  public async clearChangeDetectionLog(): Promise<void> {
    await this._locator.locator('textarea.e2e-angular-change-detection-cycles').evaluate((textAreaElement: HTMLTextAreaElement) => textAreaElement.value = '');
  }

  /**
   * Returns the current change detection log.
   */
  public async getChangeDetectionLog(): Promise<string[]> {
    const log = await waitUntilStable(() => this._locator.locator('textarea.e2e-angular-change-detection-cycles').inputValue());
    if (!log.length) {
      return [];
    }
    return log.split('\n');
  }

  /**
   * Toggles the checkbox for calling `preventDefault` on mouse down.
   */
  public async checkPreventDefaultOnMouseDown(check: boolean): Promise<void> {
    return this._locator.locator('input[type="checkbox"].e2e-prevent-default-on-mousedown').setChecked(check);
  }
}
