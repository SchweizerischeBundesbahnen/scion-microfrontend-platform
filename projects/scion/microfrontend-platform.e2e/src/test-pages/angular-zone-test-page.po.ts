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
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po/checkbox.po';
import {SciAccordionPO} from '../@scion/components.internal/accordion.po/accordion.po';

export class AngularZoneTestPagePO implements OutletPageObject {

  public readonly path = 'test-pages/angular-zone-test-page';

  public readonly messageClient: {
    observePO: PanelPO;
    requestPO: PanelPO;
    subscriberCountPO: PanelPO;
  };

  public readonly intentClient: {
    observePO: PanelPO;
    requestPO: PanelPO;
  };

  public readonly contextService: {
    observePO: PanelPO;
    namesPO: PanelPO;
  };

  public readonly manifestService: {
    lookupCapabilitiesPO: PanelPO;
    lookupIntentionsPO: PanelPO;
  };

  public readonly focusMonitor: {
    focusWithinPO: PanelPO;
    focusPO: PanelPO;
  };

  constructor(frameLocator: FrameLocator) {
    const locator = frameLocator.locator('app-angular-zone-test-page');
    this.messageClient = {
      observePO: new PanelPO(locator.locator('sci-accordion'), 'e2e-message-client.e2e-observe'),
      requestPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-message-client.e2e-request'),
      subscriberCountPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-message-client.e2e-subscriber-count'),
    };
    this.intentClient = {
      observePO: new PanelPO(locator.locator('sci-accordion'), 'e2e-intent-client.e2e-observe'),
      requestPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-intent-client.e2e-request'),
    };
    this.contextService = {
      observePO: new PanelPO(locator.locator('sci-accordion'), 'e2e-context-service.e2e-observe'),
      namesPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-context-service.e2e-names'),
    };
    this.manifestService = {
      lookupCapabilitiesPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-manifest-service.e2e-lookup-capabilities'),
      lookupIntentionsPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-manifest-service.e2e-lookup-intentions'),
    };
    this.focusMonitor = {
      focusWithinPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-focus-monitor.e2e-focus-within'),
      focusPO: new PanelPO(locator.locator('sci-accordion'), 'e2e-focus-monitor.e2e-focus'),
    };
  }
}

/**
 * Allows interacting with the specified accordion panel.
 */
export class PanelPO {

  private _accordionPO: SciAccordionPO;

  constructor(accordionLocator: Locator, private _accordionItemCssClass: string) {
    this._accordionPO = new SciAccordionPO(accordionLocator);
  }

  public async expand(): Promise<void> {
    await this._accordionPO.expand(this._accordionItemCssClass);
  }

  public async subscribe(options: {subscribeInAngularZone: boolean}): Promise<void> {
    const locator = this._accordionPO.itemLocator(this._accordionItemCssClass);
    await new SciCheckboxPO(locator.locator('sci-checkbox.e2e-run-inside-angular')).toggle(options.subscribeInAngularZone);
    await locator.locator('button.e2e-subscribe').click();
  }

  public async isEmissionReceivedInAngularZone(emission?: {nth?: number}): Promise<boolean> {
    const locator = this._accordionPO.itemLocator(this._accordionItemCssClass);
    const zoneAttributeValue = await locator.locator('output.e2e-emission').nth(emission?.nth ?? 0).getAttribute('data-zone');

    switch (zoneAttributeValue) {
      case 'inside-angular':
        return true;
      case 'outside-angular':
        return false;
      default:
        throw Error(`[Unexpected] Expected attribute "data-zone" to be "inside-angular" or "outside-angular", but was "${zoneAttributeValue}"`);
    }
  }
}
