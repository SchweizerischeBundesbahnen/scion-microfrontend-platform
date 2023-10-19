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
 * Page object for {@link SciKeyValueFieldComponent}.
 */
export class SciKeyValueFieldPO {

  constructor(private readonly _sciKeyValueFieldLocator: Locator) {
  }

  public async addEntries(entries: Record<string, any>): Promise<void> {
    const addButton = this._sciKeyValueFieldLocator.locator('button.e2e-add');
    const lastKeyInput = this._sciKeyValueFieldLocator.locator('input.e2e-key').last();
    const lastValueInput = this._sciKeyValueFieldLocator.locator('input.e2e-value').last();

    for (const key of Object.keys(entries)) {
      await addButton.click();
      await lastKeyInput.fill(key);
      await lastValueInput.fill(toTypedValue(entries[key]));
    }
  }

  public async clear(): Promise<void> {
    await this._sciKeyValueFieldLocator.locator('button.e2e-clear').click();
  }
}

/**
 * Stringifies given value adding type information for supported types.
 *
 * Supported types are: null, undefined, number, boolean, object
 *
 * @see parseTypedValue
 * @see parseTypedValues
 */
export function toTypedValue(value: unknown): string {
  if (value === null) {
    return '<null>';
  }
  if (value === undefined) {
    return '<undefined>';
  }
  switch (typeof value) {
    case 'number':
      return `<number>${value}</number>`;
    case 'boolean':
      return `<boolean>${value}</boolean>`;
    case 'object':
      return `<json>${JSON.stringify(value)}</json>`;
    default:
      return `${value}`;
  }
}
