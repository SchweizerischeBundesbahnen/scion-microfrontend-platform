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
import {enterText} from '../spec.util';
import {ManifestObjectFilter} from '@scion/microfrontend-platform';
import {SciCheckboxPO, SciListPO, SciParamsEnterPO, WaitUntil} from '@scion/toolkit.internal/widgets.po';
import {SwitchToIframeFn} from '../browser-outlet/browser-outlet.po';

export class LookupIntentionPagePO {

  public static readonly pageUrl = 'lookup-intention'; // path to the page; required by {@link TestingAppPO}

  private _pageFinder = $('app-lookup-intention');
  private _intentionsListPO: SciListPO;

  constructor(private _switchToIframeFn: SwitchToIframeFn) {
    this._intentionsListPO = new SciListPO(this._pageFinder.$('sci-list.e2e-intentions'));
  }

  /**
   * Looks up intentions matching the given filter. The lookup never completes.
   * Looked up intentions can be read via {@link getLookedUpIntentionIds} method.
   */
  public async lookup(filter?: ManifestObjectFilter): Promise<void> {
    await this._switchToIframeFn();

    if (await this._pageFinder.$('button.e2e-cancel-lookup').isPresent()) {
      await this._pageFinder.$('button.e2e-cancel-lookup').click();
    }
    await this._pageFinder.$('button.e2e-reset').click();

    if (filter && Object.keys(filter).length) {
      if (filter.id) {
        await enterText(filter.id, this._pageFinder.$('input.e2e-id'));
      }
      if (filter.type) {
        await enterText(filter.type, this._pageFinder.$('input.e2e-type'));
      }
      if (filter.qualifier && Object.keys(filter.qualifier).length === 0) {
        await new SciCheckboxPO(this._pageFinder.$('sci-checkbox.e2e-nilqualifier-if-empty')).toggle(true);
      }
      else if (filter.qualifier) {
        await new SciParamsEnterPO(this._pageFinder.$('sci-params-enter.e2e-qualifier')).enterParams(filter.qualifier);
      }
      if (filter.appSymbolicName) {
        await enterText(filter.appSymbolicName, this._pageFinder.$('input.e2e-app-symbolic-name'));
      }
    }

    await this._pageFinder.$('button.e2e-lookup').click();
  }

  /**
   * Returns the identity of the looked up intentions.
   */
  public async getLookedUpIntentionIds(waitUntil?: WaitUntil): Promise<string[]> {
    await this._switchToIframeFn();
    const listItemPOs = await this._intentionsListPO.getListItems(waitUntil);
    return Promise.all(listItemPOs.map(listItemPO => listItemPO.contentFinder.$('span.e2e-id').getText()));
  }
}
