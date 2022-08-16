/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Capability, Qualifier} from '@scion/microfrontend-platform';
import {Locator} from '@playwright/test';
import {isPresent} from '../testing.util';
import {SciListItemPO} from '../components.internal/list.po/list-item.po';
import {SciPropertyPO} from '../components.internal/property.po/property.po';

export class MessageListItemPO {

  private readonly _locator: Locator;

  constructor(private readonly _listItemPO: SciListItemPO) {
    this._locator = this._listItemPO.contentLocator.locator('app-message-list-item');
  }

  public async getTopic(): Promise<string> {
    return this._locator.locator('span.e2e-topic').innerText();
  }

  public async getParams(): Promise<Record<string, string>> {
    if (!await isPresent(this._locator.locator('sci-property.e2e-params'))) {
      return {};
    }
    return new SciPropertyPO(this._locator.locator('sci-property.e2e-params')).readProperties();
  }

  public async getHeaders(): Promise<Record<string, string>> {
    return new SciPropertyPO(this._locator.locator('sci-property.e2e-headers')).readProperties();
  }

  public async getBody(): Promise<string> {
    return this._locator.locator('span.e2e-body').innerText();
  }

  public async getReplyTo(): Promise<string | undefined> {
    const replyToLocator = this._locator.locator('span.e2e-reply-to');
    return await isPresent(replyToLocator) ? replyToLocator.innerText() : undefined;
  }

  public async getIntentType(): Promise<string> {
    return this._locator.locator('span.e2e-intent-type').innerText();
  }

  public async getIntentQualifier(): Promise<Qualifier> {
    return new SciPropertyPO(this._locator.locator('sci-property.e2e-intent-qualifier')).readProperties();
  }

  public async getIntentParams(): Promise<Record<string, string>> {
    return new SciPropertyPO(this._locator.locator('sci-property.e2e-intent-params')).readProperties();
  }

  public async getCapability(): Promise<Capability> {
    return JSON.parse(await this._listItemPO.contentLocator.locator('[data-e2e-capability]').getAttribute('data-e2e-capability'));
  }

  public async clickReply(): Promise<void> {
    await this._listItemPO.clickAction('e2e-reply');
  }
}
