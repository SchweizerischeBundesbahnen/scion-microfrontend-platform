/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { $, browser, protractor } from 'protractor';
import { SwitchToIframeFn } from '../browser-outlet/browser-outlet.po';
import { SciCheckboxPO } from '@scion/toolkit.internal/widgets.po';
import { enterText } from '../spec.util';

const EC = protractor.ExpectedConditions;

export class LookupContextValuePagePO {

  public static readonly pageUrl = 'lookup-context-value'; // path to the page; required by {@link TestingAppPO}
  private _pageFinder = $('app-context-value-lookup');

  constructor(private _switchToIframeFn: SwitchToIframeFn) {
  }

  public async enterKey(topic: string): Promise<void> {
    await this._switchToIframeFn();
    await enterText(topic, this._pageFinder.$('input.e2e-context-key'));
  }

  public async toggleCollectValues(check: boolean): Promise<void> {
    await this._switchToIframeFn();
    await new SciCheckboxPO(this._pageFinder.$('sci-checkbox.e2e-collect-values')).toggle(check);
  }

  public async clickSubscribe(): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('button.e2e-subscribe').click();
  }

  public async clickUnsubscribe(): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('button.e2e-unsubscribe').click();
  }

  public async getObservedValue<T>(): Promise<T> {
    await this._switchToIframeFn();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const valueFinder = this._pageFinder.$('output.e2e-observe-value');
    const errorFinder = this._pageFinder.$('output.e2e-observe-error');
    await browser.wait(EC.or(EC.presenceOf(valueFinder), EC.presenceOf(errorFinder)), 5000);
    if (await valueFinder.isPresent()) {
      return JSON.parse(await valueFinder.getText());
    }
    else {
      return Promise.reject(await errorFinder.getText());
    }
  }

  public async getLookedUpValue<T>(): Promise<T> {
    await this._switchToIframeFn();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const valueFinder = this._pageFinder.$('output.e2e-lookup-value');
    const errorFinder = this._pageFinder.$('output.e2e-lookup-error');
    await browser.wait(EC.or(EC.presenceOf(valueFinder), EC.presenceOf(errorFinder)), 5000);
    if (await valueFinder.isPresent()) {
      return JSON.parse(await valueFinder.getText());
    }
    else {
      return Promise.reject(await errorFinder.getText());
    }
  }

  /**
   * This method exists as a convenience method to not have to enter all fields separately.
   */
  public async lookupValue<T>(key: string, options?: { collect: boolean }): Promise<T> {
    await this._switchToIframeFn();

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
