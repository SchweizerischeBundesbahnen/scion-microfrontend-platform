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
import {Capability, ManifestObjectFilter} from '@scion/microfrontend-platform';
import {SciParamsEnterPO} from '../components.internal/params-enter.po/params-enter.po';
import {SciCheckboxPO} from '../components.internal/checkbox.po/checkbox.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export class RegisterCapabilityPagePO implements OutletPageObject {

  public readonly path = 'register-capability';

  private readonly _locator: Locator;
  private readonly _registerSectionLocator: Locator;
  private readonly _unregisterSectionLocator: Locator;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-register-capability');
    this._registerSectionLocator = this._locator.locator('section.e2e-register');
    this._unregisterSectionLocator = this._locator.locator('section.e2e-unregister');
  }

  /**
   * Registers the given capability.
   *
   * Returns a Promise that resolves to the capability ID upon successful registration, or that rejects on registration error.
   */
  public async registerCapability<T extends Capability>(capability: T): Promise<string> {
    await this._registerSectionLocator.locator('input.e2e-type').fill(capability.type);
    if (capability.qualifier) {
      await new SciParamsEnterPO(this._registerSectionLocator.locator('sci-params-enter.e2e-qualifier')).enterParams(capability.qualifier);
    }
    if (capability.params) {
      await this._registerSectionLocator.locator('input.e2e-params').fill(JSON.stringify(capability.params));
    }
    if (capability.properties) {
      await new SciParamsEnterPO(this._registerSectionLocator.locator('sci-params-enter.e2e-properties')).enterParams(capability.properties);
    }

    await new SciCheckboxPO(this._registerSectionLocator.locator('sci-checkbox.e2e-private')).toggle(capability.private);
    await this._registerSectionLocator.locator('button.e2e-register').click();

    // Evaluate the response: resolves the promise on success, or rejects it on error.
    const responseLocator = this._registerSectionLocator.locator('output.e2e-register-response');
    const errorLocator = this._registerSectionLocator.locator('output.e2e-register-error');
    return Promise.race([
      responseLocator.waitFor({state: 'attached'}).then(() => responseLocator.locator('span.e2e-capability-id').innerText()),
      errorLocator.waitFor({state: 'attached'}).then(() => errorLocator.innerText()).then(error => Promise.reject(Error(error))),
    ]);
  }

  /**
   * Unregisters capabilities matching the given filter.
   *
   * Returns a Promise that resolves upon successful unregistration, or that rejects on unregistration error.
   */
  public async unregisterCapability(filter: ManifestObjectFilter): Promise<void> {
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
