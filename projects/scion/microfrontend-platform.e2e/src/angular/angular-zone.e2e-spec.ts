/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../fixtures';
import {expect} from '@playwright/test';
import {AngularZoneTestPagePO} from '../test-pages/angular-zone-test-page.po';

/**
 * Tests RxJS Observables to emit in the correct Angular zone.
 *
 * The SCION Microfrontend Platform is framework-agnostic with no dependency on Angular. But integration in Angular applications
 * requires Observables to emit in the correct zone. For that reason, an application can register a `ObservableDecorator` to control
 * the context of Observable emissions. Angular applications typically install such a decorator to have Observables emit in the
 * correct zone.
 */
test.describe('Angular Zone Synchronization', () => {

  test('should emit in the same Angular zone as subscribed to "MessageClient#observe$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observePO = angularZonePage.messageClient.observePO;
    await observePO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observePO.subscribe({subscribeInAngularZone: true});
      await expect(await observePO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observePO.subscribe({subscribeInAngularZone: false});
      await expect(await observePO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "MessageClient#request$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const requestPO = angularZonePage.messageClient.requestPO;
    await requestPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await requestPO.subscribe({subscribeInAngularZone: true});
      await expect(await requestPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await requestPO.subscribe({subscribeInAngularZone: false});
      await expect(await requestPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "MessageClient#subscriberCount$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const subscriberCountPO = angularZonePage.messageClient.subscriberCountPO;
    await subscriberCountPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await subscriberCountPO.subscribe({subscribeInAngularZone: true});
      await expect(await subscriberCountPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await subscriberCountPO.subscribe({subscribeInAngularZone: false});
      await expect(await subscriberCountPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "IntentClient#observe$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observePO = angularZonePage.intentClient.observePO;
    await observePO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observePO.subscribe({subscribeInAngularZone: true});
      await expect(await observePO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observePO.subscribe({subscribeInAngularZone: false});
      await expect(await observePO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "IntentClient#request$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const requestPO = angularZonePage.intentClient.requestPO;
    await requestPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await requestPO.subscribe({subscribeInAngularZone: true});
      await expect(await requestPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await requestPO.subscribe({subscribeInAngularZone: false});
      await expect(await requestPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ContextService#observe$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observePO = angularZonePage.contextService.observePO;
    await observePO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observePO.subscribe({subscribeInAngularZone: true});
      await expect(await observePO.isEmissionReceivedInAngularZone({nth: 0})).toBe(true);
      await expect(await observePO.isEmissionReceivedInAngularZone({nth: 1})).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observePO.subscribe({subscribeInAngularZone: false});
      await expect(await observePO.isEmissionReceivedInAngularZone({nth: 0})).toBe(false);
      await expect(await observePO.isEmissionReceivedInAngularZone({nth: 1})).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ContextService#names$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const namesPO = angularZonePage.contextService.namesPO;
    await namesPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await namesPO.subscribe({subscribeInAngularZone: true});
      await expect(await namesPO.isEmissionReceivedInAngularZone({nth: 0})).toBe(true);
      await expect(await namesPO.isEmissionReceivedInAngularZone({nth: 1})).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await namesPO.subscribe({subscribeInAngularZone: false});
      await expect(await namesPO.isEmissionReceivedInAngularZone({nth: 0})).toBe(false);
      await expect(await namesPO.isEmissionReceivedInAngularZone({nth: 1})).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ManifestService#lookupCapabilities$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const lookupCapabilitiesPO = angularZonePage.manifestService.lookupCapabilitiesPO;
    await lookupCapabilitiesPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await lookupCapabilitiesPO.subscribe({subscribeInAngularZone: true});
      await expect(await lookupCapabilitiesPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await lookupCapabilitiesPO.subscribe({subscribeInAngularZone: false});
      await expect(await lookupCapabilitiesPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ManifestService#lookupIntentions$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const lookupIntentionsPO = angularZonePage.manifestService.lookupIntentionsPO;
    await lookupIntentionsPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await lookupIntentionsPO.subscribe({subscribeInAngularZone: true});
      await expect(await lookupIntentionsPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await lookupIntentionsPO.subscribe({subscribeInAngularZone: false});
      await expect(await lookupIntentionsPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "FocusMonitor#focusWithin$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const focusWithinPO = angularZonePage.focusMonitor.focusWithinPO;
    await focusWithinPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await focusWithinPO.subscribe({subscribeInAngularZone: true});
      await expect(await focusWithinPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await focusWithinPO.subscribe({subscribeInAngularZone: false});
      await expect(await focusWithinPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "FocusMonitor#focus$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const focusPO = angularZonePage.focusMonitor.focusPO;
    await focusPO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await focusPO.subscribe({subscribeInAngularZone: true});
      await expect(await focusPO.isEmissionReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await focusPO.subscribe({subscribeInAngularZone: false});
      await expect(await focusPO.isEmissionReceivedInAngularZone()).toBe(false);
    });
  });
});
