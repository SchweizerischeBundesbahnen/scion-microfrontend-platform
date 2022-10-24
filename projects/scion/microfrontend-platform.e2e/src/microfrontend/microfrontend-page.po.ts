/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {isPresent} from '../testing.util';
import {FrameLocator, Locator} from '@playwright/test';
import {SciPropertyPO} from '../components.internal/property.po/property.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export abstract class MicrofrontendPagePO implements OutletPageObject {

  public abstract readonly path: string;

  private readonly _locator: Locator;
  private readonly _focusWithinLocator: Locator;

  protected constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-microfrontend');
    this._focusWithinLocator = frameLocator.locator('app-root').locator('.e2e-focus-within');
  }

  public async getAppInstanceId(): Promise<string> {
    return this._locator.locator('input.e2e-app-instance-id').inputValue();
  }

  public async getComponentInstanceId(): Promise<string> {
    return this._locator.locator('input.e2e-component-instance-id').inputValue();
  }

  public async getMatrixParams(): Promise<Record<string, string>> {
    return new SciPropertyPO(this._locator.locator('sci-property.e2e-matrix-params')).readProperties();
  }

  public async getQueryParams(): Promise<Record<string, string>> {
    return new SciPropertyPO(this._locator.locator('sci-property.e2e-query-params')).readProperties();
  }

  public async getFragment(): Promise<string> {
    return this._locator.locator('input.e2e-fragment').inputValue();
  }

  public get inputFieldPO(): InputFieldPO {
    return new InputFieldPO(this._locator.locator('input.e2e-input'));
  }

  /**
   * Returns `true` if this microfrontend has received focus, or `false` if not.
   */
  public async isFocusWithin(): Promise<boolean> {
    return isPresent(this._focusWithinLocator);
  }
}

export class InputFieldPO {

  constructor(private _inputLocator: Locator) {
  }

  public async focus(): Promise<void> {
    await this._inputLocator.focus();
  }

  public async press(key: string): Promise<void> {
    await this._inputLocator.press(key);
  }
}
