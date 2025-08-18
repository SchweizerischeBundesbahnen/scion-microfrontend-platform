/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciListItemPO} from './list-item.po';
import {Locator} from '@playwright/test';

/**
 * Page object for {@link SciListComponent}.
 */
export class SciListPO {

  public readonly listItemLocator: Locator;

  constructor(sciListLocator: Locator) {
    this.listItemLocator = sciListLocator.locator('sci-list-item');
  }

  public async getListItems(): Promise<SciListItemPO[]> {
    const listItemPOs = [];
    const count = await this.listItemLocator.count();
    for (let i = 0; i < count; i++) {
      listItemPOs.push(new SciListItemPO(this.listItemLocator.nth(i)));
    }
    return listItemPOs;
  }
}
