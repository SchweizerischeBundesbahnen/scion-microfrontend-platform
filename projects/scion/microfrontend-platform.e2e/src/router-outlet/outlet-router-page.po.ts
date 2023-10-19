/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Qualifier} from '@scion/microfrontend-platform';
import {FrameLocator, Locator} from '@playwright/test';
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po';
import {SciKeyValueFieldPO} from '../@scion/components.internal/key-value-field.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';
import {waitUntilNavigationStable} from '../testing.util';

export class OutletRouterPagePO implements OutletPageObject {

  public static readonly PATH = 'outlet-router';
  public readonly path = OutletRouterPagePO.PATH;

  private readonly _locator: Locator;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-outlet-router');
  }

  public async enterOutletName(outlet: string): Promise<void> {
    await this._locator.locator('input.e2e-outlet').fill(outlet);
  }

  public async enterUrl(url: string | null): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-use-intent')).toggle(false);
    await this._locator.locator('input.e2e-url').fill(url ?? '');
  }

  public async enterIntentQualifier(qualifier: Qualifier): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-use-intent')).toggle(true);
    const qualifierEnterPO = new SciKeyValueFieldPO(this._locator.locator('sci-key-value-field.e2e-qualifier'));
    await qualifierEnterPO.clear();
    await qualifierEnterPO.addEntries(qualifier);
  }

  public async enterParams(params: Record<string, string>): Promise<void> {
    const headersEnterPO = new SciKeyValueFieldPO(this._locator.locator('sci-key-value-field.e2e-params'));
    await headersEnterPO.clear();
    await headersEnterPO.addEntries(params);
  }

  public async togglePushState(check: boolean): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-push-state')).toggle(check);
  }

  public async toggleShowSplash(check: boolean): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-show-splash')).toggle(check);
  }

  public async clickNavigate(): Promise<void> {
    await this._locator.locator('button.e2e-navigate').click();

    // Wait until navigated. If the navigation failed, throw an error.
    const errorLocator = this._locator.locator('output.e2e-navigate-error');
    await Promise.race([
      waitUntilNavigationStable(this._locator.page()),
      errorLocator.waitFor({state: 'attached'}).then(() => errorLocator.innerText()).then(error => Promise.reject(Error(error))),
    ]);
  }
}
