/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ContextEntryListItemPO} from './context-entry-list-item.po';
import {Locator} from '@playwright/test';
import {SciListPO} from '../@scion/components.internal/list.po';
import {waitUntilStable} from '../testing.util';

export class ContextListPO {

  private readonly _listPO: SciListPO;

  constructor(sciListLocator: Locator) {
    this._listPO = new SciListPO(sciListLocator);
  }

  public async getContextListItemPOs(): Promise<ContextEntryListItemPO[]> {
    const listItemPOs = await this._listPO.getListItems();
    return listItemPOs.map(listItemPO => new ContextEntryListItemPO(listItemPO));
  }

  public async getContext(): Promise<Record<string, string>> {
    return waitUntilStable(async () => {
      const contextListItemPOs: ContextEntryListItemPO[] = await this.getContextListItemPOs();

      const context: Record<string, string> = {};
      for (const listItemPO of contextListItemPOs) {
        const key = await listItemPO.getKey();
        const value = await listItemPO.getValue();
        context[key] = this.parseJSON(value) as string;
      }
      return context;
    }, {isStable: (a, b) => Object.keys(a).length === Object.keys(b).length});
  }

  private parseJSON(value: string): unknown {
    try {
      return JSON.parse(value);
    }
    catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return value;
    }
  }
}
