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
 * Tests emitting in RxJS Observables in the correct Angular zone.
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
    const observe$PO = angularZonePage.messageClient.observe$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "MessageClient#request$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.messageClient.request$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "MessageClient#subscriberCount$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.messageClient.subscriberCount$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "IntentClient#observe$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.intentClient.observe$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "IntentClient#request$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.intentClient.request$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ContextService#observe$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.contextService.observe$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-1')).toBe(true);
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-2')).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-1')).toBe(false);
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-2')).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ContextService#names$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.contextService.names$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-1')).toBe(true);
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-2')).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-1')).toBe(false);
      await expect(await observe$PO.isReponseReceivedInAngularZone('response-2')).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ManifestService#lookupCapabilities$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.manifestService.lookupCapabilities$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "ManifestService#lookupIntentions$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.manifestService.lookupIntentions$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "FocusMonitor#focusWithin$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.focusMonitor.focusWithin$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });

  test('should emit in the same Angular zone as subscribed to "FocusMonitor#focus$"', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      angularZonePage: AngularZoneTestPagePO,
    });

    const angularZonePage = pagePOs.get<AngularZoneTestPagePO>('angularZonePage');
    const observe$PO = angularZonePage.focusMonitor.focus$PO;
    await observe$PO.expand();

    await test.step('subscribeInsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: true});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(true);
    });
    await test.step('subscribeOutsideAngularZone', async () => {
      await observe$PO.subscribe({subscribeInAngularZone: false});
      await expect(await observe$PO.isReponseReceivedInAngularZone()).toBe(false);
    });
  });
});
