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
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';
import {waitUntilStable} from '../testing.util';

export class LookupContextValuePagePO implements OutletPageObject {

  public static readonly PATH = 'lookup-context-value';
  public readonly path = LookupContextValuePagePO.PATH;

  private readonly _locator: Locator;

  constructor(pageOrFrameLocator: Page | FrameLocator) {
    this._locator = pageOrFrameLocator.locator('app-context-value-lookup');
  }

  public async enterKey(topic: string): Promise<void> {
    await this._locator.locator('input.e2e-context-key').fill(topic);
  }

  public async toggleCollectValues(check: boolean): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-collect-values')).toggle(check);
  }

  public async clickSubscribe(): Promise<void> {
    await this._locator.locator('button.e2e-subscribe').click();
  }

  public async clickUnsubscribe(): Promise<void> {
    await this._locator.locator('button.e2e-unsubscribe').click();
  }

  public async getObservedValue(): Promise<string> {
    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const valueLocator = this._locator.locator('output.e2e-observe-value');
    const errorLocator = this._locator.locator('output.e2e-observe-error');
    return Promise.race<string>([
      valueLocator.waitFor({state: 'attached'}).then(() => valueLocator.innerText()).then(value => Promise.resolve(JSON.parse(value))),
      errorLocator.waitFor({state: 'attached'}).then(() => errorLocator.innerText()).then(error => Promise.reject(Error(error))),
    ]);
  }

  public async getLookedUpValue<T>(): Promise<T> {
    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const valueLocator = this._locator.locator('output.e2e-lookup-value');
    const errorLocator = this._locator.locator('output.e2e-lookup-error');
    return Promise.race<T>([
      valueLocator.waitFor({state: 'attached'}).then(async () => {
        await waitUntilStable(() => valueLocator.innerText());
        return valueLocator.innerText();
      }).then(value => Promise.resolve(JSON.parse(value))),
      errorLocator.waitFor({state: 'attached'}).then(async () => {
        await waitUntilStable(() => errorLocator.innerText());
        return errorLocator.innerText();
      }).then(error => Promise.reject(Error(error))),
    ]);
  }

  /**
   * This method exists as a convenience method to not have to enter all fields separately.
   */
  public async lookupValue<T>(key: string, options?: {collect: boolean}): Promise<T> {
    await this.enterKey(key);
    await this.toggleCollectValues(options?.collect ?? false);

    await this.clickSubscribe();
    try {
      return await this.getLookedUpValue<T>();
    }
    finally {
      await this.clickUnsubscribe();
    }
  }
}
