/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator} from '@playwright/test';
import {SciListItemPO} from '../@scion/components.internal/list.po';

export class ContextEntryListItemPO {

  private readonly _locator: Locator;

  constructor(private readonly _listItemPO: SciListItemPO) {
    this._locator = this._listItemPO.contentLocator.locator('app-context-entry');
  }

  public async getKey(): Promise<string> {
    return this._locator.locator('span.e2e-key').innerText();
  }

  public async getValue(): Promise<string> {
    return this._locator.locator('span.e2e-value').innerText();
  }

  public async clickRemove(): Promise<void> {
    await this._listItemPO.clickAction('e2e-remove');
  }
}
