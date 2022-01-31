/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {SwitchToIframeFn} from '../browser-outlet/browser-outlet.po';
import {MicrofrontendPagePO} from './microfrontend-page.po';

export class Microfrontend2PagePO extends MicrofrontendPagePO {

  public static readonly pageUrl = 'microfrontend-2'; // path to the page; required by {@link TestingAppPO}

  constructor(switchToIframeFn: SwitchToIframeFn) {
    super(switchToIframeFn);
  }
}

