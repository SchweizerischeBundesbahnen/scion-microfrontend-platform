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
import {isPresent} from '../testing.util';
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po';
import {SciParamsEnterPO} from '../@scion/components.internal/params-enter.po';
import {SciListPO} from '../@scion/components.internal/list.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export class LookupCapabilityPagePO implements OutletPageObject {

  public readonly path = 'lookup-capability';

  private readonly _locator: Locator;
  private readonly _capabilityListPO: SciListPO;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-lookup-capability');
    this._capabilityListPO = new SciListPO(this._locator.locator('sci-list.e2e-capabilities'));
  }

  /**
   * Looks up capabilities matching the given filter. The lookup never completes.
   * Looked up capabilities can be read via {@link getLookedUpCapabilities} method.
   */
  public async lookup(filter?: ManifestObjectFilter): Promise<void> {
    if (await isPresent(this._locator.locator('button.e2e-cancel-lookup'))) {
      await this._locator.locator('button.e2e-cancel-lookup').click();
    }
    if (await this._locator.locator('button.e2e-reset').isEnabled()) {
      await this._locator.locator('button.e2e-reset').click();
    }

    if (filter && Object.keys(filter).length) {
      if (filter.id) {
        await this._locator.locator('input.e2e-id').fill(filter.id);
      }
      if (filter.type) {
        await this._locator.locator('input.e2e-type').fill(filter.type);
      }
      if (filter.qualifier && Object.keys(filter.qualifier).length === 0) {
        await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-nilqualifier-if-empty')).toggle(true);
      }
      else if (filter.qualifier) {
        await new SciParamsEnterPO(this._locator.locator('sci-params-enter.e2e-qualifier')).enterParams(filter.qualifier);
      }
      if (filter.appSymbolicName) {
        await this._locator.locator('input.e2e-app-symbolic-name').fill(filter.appSymbolicName);
      }
    }

    await this._locator.locator('button.e2e-lookup').click();
  }

  /**
   * Returns looked up capabilities.
   */
  public async getLookedUpCapabilities(): Promise<Capability[]> {
    const listItemPOs = await this._capabilityListPO.getListItems();

    const capabilities: Capability[] = [];
    for (const listItemPO of listItemPOs) {
      const capability = await listItemPO.contentLocator.locator('[data-e2e-capability]').getAttribute('data-e2e-capability');
      capabilities.push(JSON.parse(capability));
    }
    return capabilities;
  }

  /**
   * Returns the identity of the looked up capabilities.
   */
  public async getLookedUpCapabilityIds(): Promise<string[]> {
    const capabilities = await this.getLookedUpCapabilities();
    return capabilities.map(capability => capability.metadata.id);
  }
}
