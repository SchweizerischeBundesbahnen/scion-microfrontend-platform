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
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po/checkbox.po';

export class MouseEventDispatchTestPagePO implements OutletPageObject {

  public readonly path = 'test-pages/mouse-event-dispatch-test-page';

  private readonly _locator: Locator;

  constructor(private _frameLocator: FrameLocator) {
    this._locator = this._frameLocator.locator('app-mouse-event-dispatch-test-page');
  }

  public async hasFocus(): Promise<boolean> {
    return isPresent(this._frameLocator.locator('app-root').locator('.e2e-has-focus'));
  }

  public async clickElement(): Promise<void> {
    await this._locator.locator('div.element').click();
  }

  /**
   * Toggles the checkbox for calling `preventDefault` on mouse down.
   */
  public async checkPreventDefaultOnMouseDown(check: boolean): Promise<void> {
    return new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-prevent-default-on-mousedown')).toggle(check);
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
  public async moveMouseToCenter(options?: {offsetX?: number; offsetY?: number}): Promise<void> {
    const {x, y, width, height} = await this._locator.boundingBox();
    const center = {x: x + width / 2, y: y + height / 2};
    await this._locator.page().mouse.move(center.x + (options?.offsetX ?? 0), center.y + (options?.offsetY ?? 0), {steps: 1});
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
   * Returns received events.
   */
  public async getReceivedEvents(): Promise<string[]> {
    const eventLocator = this._locator.locator('section.e2e-dispatched-mouse-events div.e2e-event');
    const count = await waitUntilStable(() => eventLocator.count());

    const result = new Array<string>();
    for (let i = 0; i < count; i++) {
      result.push(await eventLocator.nth(i).locator('span.e2e-type').innerText());
    }
    return result;
  }

  /**
   * Clears received events.
   */
  public async clearReceivedEvents(): Promise<void> {
    await this._locator.locator('section.e2e-dispatched-mouse-events').locator('button.e2e-clear').click();
  }
}
