/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {$} from 'protractor';
import {SwitchToIframeFn} from '../browser-outlet/browser-outlet.po';
import {getInputValue, waitUntilLocation} from '../spec.util';
import {TestingAppPO} from '../testing-app.po';
import {SciPropertyPO} from '../../deps/scion/components.internal/property.po';

export abstract class MicrofrontendPagePO {

  private _pageFinder = $('app-microfrontend');

  constructor(private _switchToIframeFn: SwitchToIframeFn) {
  }

  /**
   * Waits until the given page is showing in this PO's WebDriver execution context.
   */
  public async waitUntilLocation(url: string): Promise<void> {
    await this._switchToIframeFn();
    await waitUntilLocation(url);
  }

  public async getAppInstanceId(): Promise<string> {
    await this._switchToIframeFn();
    return getInputValue(this._pageFinder.$('input.e2e-app-instance-id'));
  }

  public async getComponentInstanceId(): Promise<string> {
    await this._switchToIframeFn();
    return getInputValue(this._pageFinder.$('input.e2e-component-instance-id'));
  }

  public async getMatrixParams(): Promise<Map<string, string>> {
    await this._switchToIframeFn();
    return new SciPropertyPO(this._pageFinder.$('sci-property.e2e-matrix-params')).readAsMap();
  }

  public async getQueryParams(): Promise<Map<string, string>> {
    await this._switchToIframeFn();
    return new SciPropertyPO(this._pageFinder.$('sci-property.e2e-query-params')).readAsMap();
  }

  public async getFragment(): Promise<string> {
    await this._switchToIframeFn();
    return getInputValue(this._pageFinder.$('input.e2e-fragment'));
  }

  public async clickInputField(): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('input.e2e-input').click();
  }

  /**
   * Clicks the fragment field to gain focus.
   */
  public async clickFragment(): Promise<void> {
    await this._switchToIframeFn();
    return this._pageFinder.$('input.e2e-fragment').click();
  }

  /**
   * Returns `true` if this microfrontend has received focus, or `false` if not.
   */
  public async isFocusWithin(): Promise<boolean> {
    return new TestingAppPO().isFocusWithin(() => this._switchToIframeFn());
  }
}
