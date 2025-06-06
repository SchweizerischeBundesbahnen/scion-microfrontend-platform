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
import {MessageListItemPO} from './message-list-item.po';
import {FrameLocator, Locator} from '@playwright/test';
import {isPresent} from '../testing.util';
import {SciListPO} from '../@scion/components.internal/list.po';
import {SciKeyValueFieldPO} from '../@scion/components.internal/key-value-field.po';
import {SciCheckboxPO} from '../@scion/components.internal/checkbox.po';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export enum MessagingFlavor {
  Topic = 'Topic', Intent = 'Intent',
}

export class PublishMessagePagePO implements OutletPageObject {

  public readonly path = 'publish-message';

  private readonly _locator: Locator;
  private readonly _replyListPO: SciListPO;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-publish-message');
    this._replyListPO = new SciListPO(this._locator.locator('sci-list.e2e-replies'));
  }

  public async selectFlavor(flavor: MessagingFlavor): Promise<void> {
    await this._locator.locator('select.e2e-flavor').selectOption(flavor);
  }

  public async enterTopic(topic: string): Promise<void> {
    await this._locator.locator('input.e2e-topic').fill(topic);
  }

  public async enterHeaders(headers: Record<string, string>): Promise<void> {
    const headersEnterPO = new SciKeyValueFieldPO(this._locator.locator('sci-key-value-field.e2e-headers'));
    await headersEnterPO.clear();
    await headersEnterPO.addEntries(headers);
  }

  public async enterIntent(type: string, qualifier?: Qualifier, params?: Record<string, any>): Promise<void> {
    await this._locator.locator('input.e2e-intent-type').fill(type);
    const qualifierEnterPO = new SciKeyValueFieldPO(this._locator.locator('sci-key-value-field.e2e-intent-qualifier'));
    await qualifierEnterPO.clear();
    if (qualifier) {
      await qualifierEnterPO.addEntries(qualifier);
    }
    const paramsEnterPO = new SciKeyValueFieldPO(this._locator.locator('sci-key-value-field.e2e-intent-params'));
    await paramsEnterPO.clear();
    if (params) {
      await paramsEnterPO.addEntries(params);
    }
  }

  public async enterMessage(message: string): Promise<void> {
    await this._locator.locator('textarea.e2e-message').fill(message);
  }

  public async toggleRequestReply(check: boolean): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-request-reply')).toggle(check);
  }

  public async toggleRetain(check: boolean): Promise<void> {
    await new SciCheckboxPO(this._locator.locator('sci-checkbox.e2e-retain')).toggle(check);
  }

  public async clickPublish(): Promise<void> {
    await this._locator.locator('button.e2e-publish').click();
  }

  public async clickCancel(): Promise<void> {
    await this._locator.locator('button.e2e-cancel').click();
  }

  public async clickClearReplies(): Promise<void> {
    await this._locator.locator('button.e2e-clear-replies').click();
  }

  public async getTopicSubscriberCount(): Promise<number> {
    const count = await this._locator.locator('span.e2e-topic-subscriber-count').innerText();
    return Number(count);
  }

  public async getReplies(): Promise<MessageListItemPO[]> {
    const listItemPOs = await this._replyListPO.getListItems();
    return listItemPOs.map(listItemPO => new MessageListItemPO(listItemPO));
  }

  public async getFirstReplyOrElseReject(): Promise<MessageListItemPO> {
    const messages = await this.getReplies();
    return messages[0]!;
  }

  public async getPublishError(): Promise<string | null> {
    const publishErrorLocator = this._locator.locator('output.e2e-publish-error');
    if (await isPresent(publishErrorLocator)) {
      return publishErrorLocator.innerText();
    }
    return null;
  }
}
