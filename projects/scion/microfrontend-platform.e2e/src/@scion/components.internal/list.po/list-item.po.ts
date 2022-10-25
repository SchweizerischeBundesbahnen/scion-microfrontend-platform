/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator} from '@playwright/test';

/**
 * Page object for {@link SciListItemComponent}.
 */
export class SciListItemPO {

  public readonly contentLocator: Locator;
  public readonly actionsLocator: Locator;

  constructor(sciListItemLocator: Locator) {
    this.contentLocator = sciListItemLocator.locator('div.e2e-item');
    this.actionsLocator = sciListItemLocator.locator('ul.e2e-actions').locator('li.e2e-action');
  }

  public async clickAction(cssClass: string): Promise<void> {
    const actionButtonLocator = this.actionsLocator.locator(`button.${cssClass}`);
    await this.contentLocator.hover();
    await actionButtonLocator.click();
  }
}
