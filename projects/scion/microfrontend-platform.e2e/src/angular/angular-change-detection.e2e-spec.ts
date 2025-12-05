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
import {AngularChangeDetectionTestPagePO} from '../test-pages/angular-change-detection-test-page.po';

/**
 * Tests correct subscribing to DOM events, important for Angular applications to avoid triggering unnecessary change detection cycles.
 *
 * The SCION Microfrontend Platform is framework-agnostic with no dependency on Angular. But integration in Angular applications
 * requires Observables to emit in the correct zone. For that reason, an application can register a `ObservableDecorator` to control
 * the context of Observable emissions. Angular applications typically install such a decorator to have Observables emit in the
 * correct zone.
 */
test.describe('Angular Change Detection', () => {

  test('should not trigger Angular change detection when moving the mouse in the active outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: AngularChangeDetectionTestPagePO,
      inactiveOutlet: AngularChangeDetectionTestPagePO,
    });

    const activeOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('inactiveOutlet');

    // Make outlet the active outlet.
    await activeOutlet.clickCenter();
    await expect.poll(() => activeOutlet.hasFocus()).toBe(true);
    await expect.poll(() => inactiveOutlet.hasFocus()).toBe(false);

    // Clear change detection log.
    await activeOutlet.clearChangeDetectionLog();
    await inactiveOutlet.clearChangeDetectionLog();

    // Move mouse around the center of the active outlet.
    await activeOutlet.moveMouseToCenter();
    await activeOutlet.moveMouseToCenter({x: 1});
    await activeOutlet.moveMouseToCenter({y: 1});
    await activeOutlet.moveMouseToCenter({x: -2});
    await activeOutlet.moveMouseToCenter({y: -2});

    // Expect no change detection cycles to be triggered.
    await expect.poll(() => activeOutlet.getChangeDetectionLog()).toEqual([]);
    await expect.poll(() => inactiveOutlet.getChangeDetectionLog()).toEqual([]);
  });

  test('should not trigger Angular change detection when moving the mouse in the inactive outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: AngularChangeDetectionTestPagePO,
      inactiveOutlet: AngularChangeDetectionTestPagePO,
    });

    const activeOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('inactiveOutlet');

    // Make outlet the active outlet.
    await activeOutlet.clickCenter();
    await expect.poll(() => activeOutlet.hasFocus()).toBe(true);
    await expect.poll(() => inactiveOutlet.hasFocus()).toBe(false);

    // Clear change detection log.
    await activeOutlet.clearChangeDetectionLog();
    await inactiveOutlet.clearChangeDetectionLog();

    // Move mouse around the center of the active outlet.
    await inactiveOutlet.moveMouseToCenter();
    await inactiveOutlet.moveMouseToCenter({x: 1});
    await inactiveOutlet.moveMouseToCenter({y: 1});
    await inactiveOutlet.moveMouseToCenter({x: -2});
    await inactiveOutlet.moveMouseToCenter({y: -2});

    // Expect no change detection cycles to be triggered.
    await expect.poll(() => activeOutlet.getChangeDetectionLog()).toEqual([]);
    await expect.poll(() => inactiveOutlet.getChangeDetectionLog()).toEqual([]);
  });

  test('should not trigger Angular change detection when moving the mouse with the mouse button pressed in the active and inactive outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: AngularChangeDetectionTestPagePO,
      inactiveOutlet: AngularChangeDetectionTestPagePO,
    });

    const activeOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('inactiveOutlet');

    // Make outlet the active outlet.
    await activeOutlet.clickCenter();
    await expect.poll(() => activeOutlet.hasFocus()).toBe(true);
    await expect.poll(() => inactiveOutlet.hasFocus()).toBe(false);

    // Clear change detection log.
    await activeOutlet.clearChangeDetectionLog();
    await inactiveOutlet.clearChangeDetectionLog();

    await test.step('mousedown.preventDefault=true', async () => {
      await activeOutlet.checkPreventDefaultOnMouseDown(true);

      // Press the mouse button on the element.
      await activeOutlet.moveMouseToElement();
      await activeOutlet.mouseDown();

      // Move mouse around the center of the active outlet.
      await activeOutlet.moveMouseToCenter({x: 1});
      await activeOutlet.moveMouseToCenter({y: 1});
      await activeOutlet.moveMouseToCenter({x: -2});
      await activeOutlet.moveMouseToCenter({y: -2});

      // Move mouse to inactive outlet.
      await inactiveOutlet.moveMouseToCenter({x: 1});
      await inactiveOutlet.moveMouseToCenter({y: 1});
      await inactiveOutlet.moveMouseToCenter({x: -2});
      await inactiveOutlet.moveMouseToCenter({y: -2});

      // Release the mouse button.
      await inactiveOutlet.mouseUp();

      // Expect no change detection cycles to be triggered.
      await expect.poll(() => activeOutlet.getChangeDetectionLog()).toEqual([]);
      await expect.poll(() => inactiveOutlet.getChangeDetectionLog()).toEqual([]);
    });

    await test.step('mousedown.preventDefault=false', async () => {
      await activeOutlet.checkPreventDefaultOnMouseDown(false);

      // Press the mouse button on the element.
      await activeOutlet.moveMouseToElement();
      await activeOutlet.mouseDown();

      // Move mouse around the center of the active outlet.
      await activeOutlet.moveMouseToCenter({x: 1});
      await activeOutlet.moveMouseToCenter({y: 1});
      await activeOutlet.moveMouseToCenter({x: -2});
      await activeOutlet.moveMouseToCenter({y: -2});

      // Move mouse to inactive outlet.
      await inactiveOutlet.moveMouseToCenter({x: 1});
      await inactiveOutlet.moveMouseToCenter({y: 1});
      await inactiveOutlet.moveMouseToCenter({x: -2});
      await inactiveOutlet.moveMouseToCenter({y: -2});

      // Release the mouse button.
      await inactiveOutlet.mouseUp();

      // Expect no change detection cycles to be triggered.
      await expect.poll(() => activeOutlet.getChangeDetectionLog()).toEqual([]);
      await expect.poll(() => inactiveOutlet.getChangeDetectionLog()).toEqual([]);
    });
  });

  test('should not trigger Angular change detection when clicking in the active outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: AngularChangeDetectionTestPagePO,
      inactiveOutlet: AngularChangeDetectionTestPagePO,
    });

    const activeOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('inactiveOutlet');

    // Make outlet the active outlet.
    await activeOutlet.clickCenter();
    await expect.poll(() => activeOutlet.hasFocus()).toBe(true);
    await expect.poll(() => inactiveOutlet.hasFocus()).toBe(false);

    // Clear change detection log.
    await activeOutlet.clearChangeDetectionLog();
    await inactiveOutlet.clearChangeDetectionLog();

    // Click into the active outlet.
    await activeOutlet.clickCenter();

    // Expect no change detection cycles to be triggered.
    await expect.poll(() => activeOutlet.getChangeDetectionLog()).toEqual([]);
    await expect.poll(() => inactiveOutlet.getChangeDetectionLog()).toEqual([]);
  });

  test('should not trigger Angular change detection when typing in the active outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: AngularChangeDetectionTestPagePO,
      inactiveOutlet: AngularChangeDetectionTestPagePO,
    });

    const activeOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<AngularChangeDetectionTestPagePO>('inactiveOutlet');

    // Make outlet the active outlet.
    await activeOutlet.clickCenter();
    await expect.poll(() => activeOutlet.hasFocus()).toBe(true);
    await expect.poll(() => inactiveOutlet.hasFocus()).toBe(false);

    // Clear change detection log.
    await activeOutlet.clearChangeDetectionLog();
    await inactiveOutlet.clearChangeDetectionLog();

    // Type Text into the textarea.
    await activeOutlet.type('TEST');

    // Expect no change detection cycles to be triggered.
    await expect.poll(() => activeOutlet.getChangeDetectionLog()).toEqual(['TEST']);
    await expect.poll(() => inactiveOutlet.getChangeDetectionLog()).toEqual([]);
  });
});
