/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ContextListPO} from './context-list.po';
import {FrameLocator, Locator} from '@playwright/test';
import {OutletPageObject} from '../browser-outlet/browser-outlet.po';

export class ContextPagePO implements OutletPageObject {

  public static readonly PATH = 'context';
  public readonly path = ContextPagePO.PATH;

  private readonly _locator: Locator;

  constructor(frameLocator: FrameLocator) {
    this._locator = frameLocator.locator('app-context');
  }

  public getContext(): Promise<Record<string, unknown>> {
    const contextListPO = new ContextListPO(this._locator.locator('sci-list'));
    return contextListPO.getContext();
  }
}
