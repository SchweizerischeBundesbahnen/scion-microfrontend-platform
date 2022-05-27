/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {$, browser, protractor} from 'protractor';
import {enterText} from '../spec.util';
import {SwitchToIframeFn} from '../browser-outlet/browser-outlet.po';
import {SciParamsEnterPO} from '../../deps/scion/components.internal/params-enter.po';
import {SciCheckboxPO} from '../../deps/scion/components.internal/checkbox.po';
import {Qualifier} from '@scion/microfrontend-platform';

const EC = protractor.ExpectedConditions;

export class OutletRouterPagePO {

  public static readonly pageUrl = 'outlet-router'; // path to the page; required by {@link TestingAppPO}

  private _pageFinder = $('app-outlet-router');

  constructor(private _switchToIframeFn: SwitchToIframeFn) {
  }

  public async enterOutletName(outlet: string): Promise<void> {
    await this._switchToIframeFn();
    await enterText(outlet, this._pageFinder.$('input.e2e-outlet'));
  }

  public async enterUrl(url: string): Promise<void> {
    await this._switchToIframeFn();
    await new SciCheckboxPO(this._pageFinder.$('sci-checkbox.e2e-use-intent')).toggle(false);
    await enterText(url, this._pageFinder.$('input.e2e-url'));
  }

  public async enterIntentQualifier(qualifier: Qualifier): Promise<void> {
    await this._switchToIframeFn();

    await new SciCheckboxPO(this._pageFinder.$('sci-checkbox.e2e-use-intent')).toggle(true);
    const qualifierEnterPO = new SciParamsEnterPO(this._pageFinder.$('sci-params-enter.e2e-qualifier'));
    await qualifierEnterPO.clear();
    await qualifierEnterPO.enterParams(qualifier);
  }

  public async enterParams(params: Map<string, string>): Promise<void> {
    await this._switchToIframeFn();

    const headersEnterPO = new SciParamsEnterPO(this._pageFinder.$('sci-params-enter.e2e-params'));
    await headersEnterPO.clear();
    await headersEnterPO.enterParams(params);
  }

  public async togglePushState(check: boolean): Promise<void> {
    await this._switchToIframeFn();
    await new SciCheckboxPO(this._pageFinder.$('sci-checkbox.e2e-push-state')).toggle(check);
  }

  /**
   * Clicks navigate.
   *
   * Set `evalNavigateResponse` to `false` when replacing the current microfrontend,
   * as this unloads the current router page.
   */
  public async clickNavigate(options?: {evalNavigateResponse?: boolean}): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('button.e2e-navigate').click();

    if (!(options?.evalNavigateResponse ?? true)) {
      return;
    }

    // Wait until navigated. If the navigation failed, throw an error.
    const navigatedFinder = this._pageFinder.$('output.e2e-navigated');
    const errorFinder = this._pageFinder.$('output.e2e-navigate-error');
    await browser.wait(EC.or(EC.presenceOf(navigatedFinder), EC.presenceOf(errorFinder)), 5000);
    if (await navigatedFinder.isPresent()) {
      return;
    }
    else {
      throw Error(await errorFinder.getText());
    }
  }
}
