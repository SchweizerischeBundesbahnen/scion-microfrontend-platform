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

export class ClearOutletThenSendMessageTestPagePO implements OutletPageObject {

  public readonly path = 'test-pages/clear-outlet-then-send-message-test-page';

  private readonly _locator: Locator;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-clear-outlet-then-send-message-test-page');
  }

  public async enterOutletName(outlet: string): Promise<void> {
    await this._locator.locator('input.e2e-outlet').fill(outlet);
  }

  public async enterTopic(topic: string): Promise<void> {
    await this._locator.locator('input.e2e-topic').fill(topic);
  }

  public async clickRunTest(): Promise<void> {
    await this._locator.locator('button.e2e-run-test').click();
  }
}
