/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPagePO} from './microfrontend-page.po';
import {FrameLocator} from '@playwright/test';

export class Microfrontend1PagePO extends MicrofrontendPagePO {

  public static readonly PATH = 'test-pages/microfrontend-1-test-page';
  public readonly path = Microfrontend1PagePO.PATH;

  constructor(frameLocator: FrameLocator) {
    super(frameLocator);
  }
}
