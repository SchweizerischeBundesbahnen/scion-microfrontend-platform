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

/**
 * Page object for {@link SciKeyValueComponent}.
 */
export class SciKeyValuePO {

  constructor(private readonly _sciKeyValueLocator: Locator) {
  }

  /**
   * Reads the entries as dictionary.
   */
  public async readEntries(): Promise<Record<string, string>> {
    const keysLocator = this._sciKeyValueLocator.locator('.e2e-key');
    const valuesLocator = this._sciKeyValueLocator.locator('.e2e-value');

    const entryCount = await keysLocator.count();
    const entries: Record<string, string> = {};
    for (let i = 0; i < entryCount; i++) {
      const key = await keysLocator.nth(i).innerText();
      entries[key] = await valuesLocator.nth(i).innerText();
    }

    return entries;
  }
}
