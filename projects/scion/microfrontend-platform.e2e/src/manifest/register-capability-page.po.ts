/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { $, browser, protractor } from 'protractor';
import { enterText } from '../spec.util';
import { ManifestObjectFilter, ParamDefinition, Qualifier } from '@scion/microfrontend-platform';
import { SciCheckboxPO, SciParamsEnterPO } from '@scion/toolkit.internal/widgets.po';
import { SwitchToIframeFn } from '../browser-outlet/browser-outlet.po';

const EC = protractor.ExpectedConditions;

export class RegisterCapabilityPagePO {

  public static readonly pageUrl = 'register-capability'; // path to the page; required by {@link TestingAppPO}

  private _pageFinder = $('app-register-capability');
  private _registerSectionFinder = this._pageFinder.$('section.e2e-register');
  private _unregisterSectionFinder = this._pageFinder.$('section.e2e-unregister');

  constructor(private _switchToIframeFn: SwitchToIframeFn) {
  }

  /**
   * Registers the given capability.
   *
   * Returns a Promise that resolves to the capability ID upon successful registration, or that rejects on registration error.
   */
  public async registerCapability(capability: { type: string, qualifier?: Qualifier, params?: ParamDefinition[], private: boolean }): Promise<string> {
    await this._switchToIframeFn();
    await enterText(capability.type, this._registerSectionFinder.$('input.e2e-type'));
    if (capability.qualifier) {
      await new SciParamsEnterPO(this._registerSectionFinder.$('sci-params-enter.e2e-qualifier')).enterParams(capability.qualifier);
    }
    if (capability.params) {
      await enterText(JSON.stringify(capability.params), this._registerSectionFinder.$('input.e2e-params'));
    }

    await new SciCheckboxPO(this._registerSectionFinder.$('sci-checkbox.e2e-private')).toggle(capability.private);
    await this._registerSectionFinder.$('button.e2e-register').click();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const responseFinder = this._registerSectionFinder.$('output.e2e-register-response');
    const errorFinder = this._registerSectionFinder.$('output.e2e-register-error');
    await browser.wait(EC.or(EC.presenceOf(responseFinder), EC.presenceOf(errorFinder)), 5000);
    if (await responseFinder.isPresent()) {
      return responseFinder.$('span.e2e-capability-id').getText();
    }
    else {
      return Promise.reject(await errorFinder.getText());
    }
  }

  /**
   * Unregisters capabilities matching the given filter.
   *
   * Returns a Promise that resolves upon successful unregistration, or that rejects on unregistration error.
   */
  public async unregisterCapability(filter: ManifestObjectFilter): Promise<void> {
    await this._switchToIframeFn();
    if (filter.id) {
      await enterText(filter.id, this._unregisterSectionFinder.$('input.e2e-id'));
    }
    if (filter.type) {
      await enterText(filter.type, this._unregisterSectionFinder.$('input.e2e-type'));
    }
    if (filter.qualifier && Object.keys(filter.qualifier).length === 0) {
      await new SciCheckboxPO(this._unregisterSectionFinder.$('sci-checkbox.e2e-nilqualifier-if-empty')).toggle(true);
    }
    else if (filter.qualifier) {
      await new SciParamsEnterPO(this._unregisterSectionFinder.$('sci-params-enter.e2e-qualifier')).enterParams(filter.qualifier);
    }
    if (filter.appSymbolicName) {
      await enterText(filter.appSymbolicName, this._unregisterSectionFinder.$('input.e2e-app-symbolic-name'));
    }

    await this._unregisterSectionFinder.$('button.e2e-unregister').click();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const responseFinder = this._unregisterSectionFinder.$('output.e2e-unregister-response');
    const errorFinder = this._unregisterSectionFinder.$('output.e2e-unregister-error');
    await browser.wait(EC.or(EC.presenceOf(responseFinder), EC.presenceOf(errorFinder)), 5000);
    if (await responseFinder.isPresent()) {
      return Promise.resolve();
    }
    else {
      return Promise.reject(await errorFinder.getText());
    }
  }
}
