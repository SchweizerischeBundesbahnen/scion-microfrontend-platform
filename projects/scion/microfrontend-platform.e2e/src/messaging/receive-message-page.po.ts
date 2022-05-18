/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {enterText, selectOption} from '../spec.util';
import {MessagingFlavor} from './publish-message-page.po';
import {$} from 'protractor';
import {Qualifier} from '@scion/microfrontend-platform';
import {MessageListItemPO} from './message-list-item.po';
import {SciListPO, WaitUntil} from '../../deps/scion/components.internal/list.po';
import {SciParamsEnterPO} from '../../deps/scion/components.internal/params-enter.po';

export class ReceiveMessagePagePO {

  public static readonly pageUrl = 'receive-message'; // path to the page; required by {@link TestingAppPO}

  private _pageFinder = $('app-receive-message');
  private _messageListPO: SciListPO;

  constructor(private _switchToIframeFn: () => Promise<void>) {
    this._messageListPO = new SciListPO(this._pageFinder.$('sci-list.e2e-messages'));
  }

  public async selectFlavor(flavor: MessagingFlavor): Promise<void> {
    await this._switchToIframeFn();
    await selectOption(flavor, this._pageFinder.$('select.e2e-flavor'));
  }

  public async enterTopic(topic: string): Promise<void> {
    await this._switchToIframeFn();
    await enterText(topic, this._pageFinder.$('input.e2e-topic'));
  }

  public async enterIntentSelector(type: string, qualifier?: Qualifier): Promise<void> {
    await this._switchToIframeFn();
    await enterText(type, this._pageFinder.$('input.e2e-intent-type'));
    const paramsEnterPO = new SciParamsEnterPO(this._pageFinder.$('sci-params-enter.e2e-intent-qualifier'));
    await paramsEnterPO.clear();
    if (qualifier) {
      await paramsEnterPO.enterParams(qualifier);
    }
  }

  public async clickSubscribe(): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('button.e2e-subscribe').click();
  }

  public async clickUnsubscribe(): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('button.e2e-unsubscribe').click();
  }

  public async clickClearMessages(): Promise<void> {
    await this._switchToIframeFn();
    await this._pageFinder.$('button.e2e-clear-messages').click();
  }

  public async getMessages(waitUntil?: WaitUntil): Promise<MessageListItemPO[]> {
    await this._switchToIframeFn();
    const listItemPOs = await this._messageListPO.getListItems(waitUntil);
    return listItemPOs.map(listItemPO => new MessageListItemPO(listItemPO, this._switchToIframeFn));
  }

  public async getFirstMessageOrElseReject(maxWaitTimeout?: number): Promise<MessageListItemPO> {
    await this._switchToIframeFn();
    const messages = await this.getMessages({itemCount: 1, matcher: 'eq', timeout: maxWaitTimeout});
    return messages[0];
  }
}
