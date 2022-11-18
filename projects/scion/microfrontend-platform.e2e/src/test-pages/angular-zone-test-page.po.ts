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

  public messageClient: {
    observe$PO: PanelPO;
    request$PO: PanelPO;
    subscriberCount$PO: PanelPO;
  };

  public intentClient: {
    observe$PO: PanelPO;
    request$PO: PanelPO;
  };

  public contextService: {
    observe$PO: PanelPO;
    names$PO: PanelPO;
  };

  public manifestService: {
    lookupCapabilities$PO: PanelPO;
    lookupIntentions$PO: PanelPO;
  };

  public focusMonitor: {
    focusWithin$PO: PanelPO;
  };

  constructor(frameLocator: FrameLocator) {
    const locator = frameLocator.locator('app-angular-zone-test-page');
    this.messageClient = {
      observe$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-message-client.e2e-observe'),
      request$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-message-client.e2e-request'),
      subscriberCount$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-message-client.e2e-subscriber-count'),
    };
    this.intentClient = {
      observe$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-intent-client.e2e-observe'),
      request$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-intent-client.e2e-request'),
    };
    this.contextService = {
      observe$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-context-service.e2e-observe'),
      names$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-context-service.e2e-names'),
    };
    this.manifestService = {
      lookupCapabilities$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-manifest-service.e2e-lookup-capabilities'),
      lookupIntentions$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-manifest-service.e2e-lookup-intentions'),
    };
    this.focusMonitor = {
      focusWithin$PO: new PanelPO(locator.locator('sci-accordion'), 'e2e-focus-monitor.e2e-focus-within'),
    };
  }
}

/**
 * Allows interacting with the specified accordion item.
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

  public async isReponseReceivedInAngularZone(responseSelector: 'response-1' | 'response-2' = 'response-1'): Promise<boolean> {
    const locator = this._accordionPO.itemLocator(this._accordionItemCssClass);
    const zoneAttributeValue = await locator.locator(`output.e2e-${responseSelector}`).getAttribute('data-zone');

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
