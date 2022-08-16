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

/**
 * Page object for {@link RouterOutletSettingsComponent}.
 */
export class RouterOutletSettingsPO {

  private readonly _overlayLocator: Locator;

  constructor(pageOrFrameLocator: Page | FrameLocator) {
    this._overlayLocator = pageOrFrameLocator.locator('.e2e-router-outlet-settings-overlay app-router-outlet-settings');
  }

  public async close(): Promise<void> {
    await this._overlayLocator.press('Escape');
  }

  public async clickPreferredSizeReset(): Promise<void> {
    await this._overlayLocator.locator('li.e2e-preferred-size').locator('button.e2e-reset').click();
  }
}
