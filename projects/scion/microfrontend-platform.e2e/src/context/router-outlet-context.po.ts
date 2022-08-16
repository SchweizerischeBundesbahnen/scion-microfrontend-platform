/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {findAsync} from '../testing.util';
import {ContextListPO} from './context-list.po';
import {FrameLocator, Locator, Page} from '@playwright/test';

/**
 * Page object for {@link RouterOutletContextComponent}.
 */
export class RouterOutletContextPO {

  private readonly _overlayLocator: Locator;
  private readonly _contextListPO: ContextListPO;

  constructor(pageOrFrameLocator: Page | FrameLocator) {
    this._overlayLocator = pageOrFrameLocator.locator('.e2e-router-outlet-context-overlay app-router-outlet-context');
    this._contextListPO = new ContextListPO(this._overlayLocator.locator('sci-list.e2e-context'));
  }

  public async close(): Promise<void> {
    await this._overlayLocator.locator('header.e2e-header button.e2e-close').click();
  }

  public async addContextValue(key: string, value: string | undefined | null): Promise<void> {
    const addEntrySectionLocator = this._overlayLocator.locator('section.e2e-new-context-entry');
    await addEntrySectionLocator.locator('input.e2e-name').fill(key);
    if (value === undefined) {
      await addEntrySectionLocator.locator('input.e2e-value').fill('<undefined>');
    }
    else if (value === null) {
      await addEntrySectionLocator.locator('input.e2e-value').fill('<null>');
    }
    else {
      await addEntrySectionLocator.locator('input.e2e-value').fill(value);
    }
    await addEntrySectionLocator.locator('button.e2e-add').click();
  }

  public async removeContextValue(key: string): Promise<void> {
    const contextListItemPOs = await this._contextListPO.getContextListItemPOs();
    const contextListItemPO = await findAsync(contextListItemPOs, async listItemPO => (await listItemPO.getKey()) === key);
    await contextListItemPO.clickRemove();
  }
}
