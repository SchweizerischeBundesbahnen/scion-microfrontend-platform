/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {PlatformPropertiesPagePO} from './platform-properties-page.po';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('PlatformProperties', () => {

  test('should allow looking up platform properties from a microfrontend', async ({testingAppPO}) => {
    const platformProperties = new Map().set('property1', 'value1').set('property2', 'value2');

    const pagePOs = await testingAppPO.navigateTo({
      outlet: {
        microfrontend1: PlatformPropertiesPagePO,
        microfrontend2: PlatformPropertiesPagePO,
      },
    }, {queryParams: platformProperties});

    const microfrontend1PO = pagePOs.get<PlatformPropertiesPagePO>('microfrontend1');
    await expect(await microfrontend1PO.getPlatformProperties()).toEqual(expect.objectContaining({'property1': 'value1', 'property2': 'value2'}));

    const microfrontend2PO = pagePOs.get<PlatformPropertiesPagePO>('microfrontend2');
    await expect(await microfrontend2PO.getPlatformProperties()).toEqual(expect.objectContaining({'property1': 'value1', 'property2': 'value2'}));
  });
});
