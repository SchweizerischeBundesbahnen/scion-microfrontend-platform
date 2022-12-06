/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {FrameLocator, Locator} from '@playwright/test';
import {ManifestObjectFilter, Qualifier} from '@scion/microfrontend-platform';
import {SciParamsEnterPO} from '../@scion/components.internal/params-enter.po';
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export class RegisterIntentionPagePO implements OutletPageObject {

  public readonly path = 'register-intention';

  private readonly _locator: Locator;
  private readonly _registerSectionLocator: Locator;
  private readonly _unregisterSectionLocator: Locator;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-register-intention');
    this._registerSectionLocator = this._locator.locator('section.e2e-register');
    this._unregisterSectionLocator = this._locator.locator('section.e2e-unregister');
  }

  /**
   * Registers the given intention.
   *
   * Returns a Promise that resolves to the intention ID upon successful registration, or that rejects on registration error.
   */
  public async registerIntention(intention: {type: string; qualifier?: Qualifier}): Promise<string> {
    await this._registerSectionLocator.locator('input.e2e-type').fill(intention.type);
    if (intention.qualifier) {
      await new SciParamsEnterPO(this._registerSectionLocator.locator('sci-params-enter.e2e-qualifier')).enterParams(intention.qualifier);
    }

    await this._registerSectionLocator.locator('button.e2e-register').click();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const responseLocator = this._registerSectionLocator.locator('output.e2e-register-response');
    const errorLocator = this._registerSectionLocator.locator('output.e2e-register-error');
    return Promise.race([
      responseLocator.waitFor({state: 'attached'}).then(() => responseLocator.locator('span.e2e-intention-id').innerText()),
      errorLocator.waitFor({state: 'attached'}).then(() => errorLocator.innerText()).then(error => Promise.reject(Error(error))),
    ]);
  }

  /**
   * Unregisters intentions matching the given filter.
   *
   * Returns a Promise that resolves upon successful unregistration, or that rejects on unregistration error.
   */
  public async unregisterIntentions(filter: ManifestObjectFilter): Promise<void> {
    if (filter.id) {
      await this._unregisterSectionLocator.locator('input.e2e-id').fill(filter.id);
    }
    if (filter.type) {
      await this._unregisterSectionLocator.locator('input.e2e-type').fill(filter.type);
    }
    if (filter.qualifier && Object.keys(filter.qualifier).length === 0) {
      await new SciCheckboxPO(this._unregisterSectionLocator.locator('sci-checkbox.e2e-nilqualifier-if-empty')).toggle(true);
    }
    else if (filter.qualifier) {
      await new SciParamsEnterPO(this._unregisterSectionLocator.locator('sci-params-enter.e2e-qualifier')).enterParams(filter.qualifier);
    }
    if (filter.appSymbolicName) {
      await this._unregisterSectionLocator.locator('input.e2e-app-symbolic-name').fill(filter.appSymbolicName);
    }

    await this._unregisterSectionLocator.locator('button.e2e-unregister').click();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const responseLocator = this._unregisterSectionLocator.locator('output.e2e-unregister-response');
    const errorLocator = this._unregisterSectionLocator.locator('output.e2e-unregister-error');
    return Promise.race([
      responseLocator.waitFor({state: 'attached'}),
      errorLocator.waitFor({state: 'attached'}).then(() => errorLocator.innerText()).then(error => Promise.reject(Error(error))),
    ]);
  }
}
