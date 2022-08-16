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
import {MessagingFlavor} from './publish-message-page.po';
import {Qualifier} from '@scion/microfrontend-platform';
import {MessageListItemPO} from './message-list-item.po';
import {SciListPO} from '../components.internal/list.po/list.po';
import {SciParamsEnterPO} from '../components.internal/params-enter.po/params-enter.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export class ReceiveMessagePagePO implements OutletPageObject {

  public readonly path = 'receive-message';

  private readonly _locator: Locator;
  private readonly _messageListPO: SciListPO;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-receive-message');
    this._messageListPO = new SciListPO(this._locator.locator('sci-list.e2e-messages'));
  }

  public async selectFlavor(flavor: MessagingFlavor): Promise<void> {
    await this._locator.locator('select.e2e-flavor').selectOption(flavor);
  }

  public async enterTopic(topic: string): Promise<void> {
    await this._locator.locator('input.e2e-topic').fill(topic);
  }

  public async enterIntentSelector(type: string, qualifier?: Qualifier): Promise<void> {
    await this._locator.locator('input.e2e-intent-type').fill(type);
    const paramsEnterPO = new SciParamsEnterPO(this._locator.locator('sci-params-enter.e2e-intent-qualifier'));
    await paramsEnterPO.clear();
    if (qualifier) {
      await paramsEnterPO.enterParams(qualifier);
    }
  }

  public async clickSubscribe(): Promise<void> {
    await this._locator.locator('button.e2e-subscribe').click();
  }

  public async clickUnsubscribe(): Promise<void> {
    await this._locator.locator('button.e2e-unsubscribe').click();
  }

  public async clickClearMessages(): Promise<void> {
    await this._locator.locator('button.e2e-clear-messages').click();
  }

  public async getMessages(): Promise<MessageListItemPO[]> {
    const listItemPOs = await this._messageListPO.getListItems();
    return listItemPOs.map(listItemPO => new MessageListItemPO(listItemPO));
  }

  public async getFirstMessageOrElseReject(): Promise<MessageListItemPO> {
    const messages = await this.getMessages();
    if (messages.length > 0) {
      return messages[0];
    }
    throw Error('[NoMessageFoundError] No message was found.');
  }
}
