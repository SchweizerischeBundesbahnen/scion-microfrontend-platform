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
import {ManifestObjectFilter} from '@scion/microfrontend-platform';
import {isPresent} from '../testing.util';
import {SciParamsEnterPO} from '../components.internal/params-enter.po/params-enter.po';
import {SciListPO} from '../components.internal/list.po/list.po';
import {SciCheckboxPO} from '../components.internal/checkbox.po/checkbox.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export class LookupIntentionPagePO implements OutletPageObject {

  public readonly path = 'lookup-intention';

  private readonly _locator: Locator;
  private readonly _intentionsListPO: SciListPO;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-lookup-intention');
    this._intentionsListPO = new SciListPO(this._locator.locator('sci-list.e2e-intentions'));
  }

  /**
   * Looks up intentions matching the given filter. The lookup never completes.
   * Looked up intentions can be read via {@link getLookedUpIntentionIds} method.
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
   * Returns the identity of the looked up intentions.
   */
  public async getLookedUpIntentionIds(): Promise<string[]> {
    const listItemPOs = await this._intentionsListPO.getListItems();
    return Promise.all(listItemPOs.map(listItemPO => listItemPO.contentLocator.locator('span.e2e-id').innerText()));
  }
}
