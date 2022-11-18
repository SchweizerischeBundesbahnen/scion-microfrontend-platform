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
import {MouseEventDispatchTestPagePO} from '../test-pages/mouse-event-dispatch-test-page.po';
import {expect} from '@playwright/test';

test.describe('Mouse Event Dispatching', () => {

  test('should not dispatch "sci-mouseup" events when clicking in the active outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: MouseEventDispatchTestPagePO,
      inactiveOutlet: MouseEventDispatchTestPagePO,
    });

    const activeOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('inactiveOutlet');

    // Activate the outlet.
    await activeOutlet.clickElement();

    // Press and release the mouse.
    await activeOutlet.checkPreventDefaultOnMouseDown(true);
    await activeOutlet.moveMouseToElement();
    await activeOutlet.mouseDown();
    await activeOutlet.mouseUp();

    // Press and release the mouse.
    await activeOutlet.checkPreventDefaultOnMouseDown(false);
    await activeOutlet.moveMouseToElement();
    await activeOutlet.mouseDown();
    await activeOutlet.mouseUp();

    // Expect no mouse events to be dispatched.
    await expect(await activeOutlet.getReceivedEvents()).toEqual([]);
    await expect(await inactiveOutlet.getReceivedEvents()).toEqual([]);

    // Expect focus ownership not to have changed.
    await expect(await activeOutlet.hasFocus()).toBe(true);
    await expect(await inactiveOutlet.hasFocus()).toBe(false);
  });

  test('should not dispatch "sci-mousemove" events when moving the mouse in the active outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: MouseEventDispatchTestPagePO,
      inactiveOutlet: MouseEventDispatchTestPagePO,
    });

    const activeOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('inactiveOutlet');

    // Activate the outlet.
    await activeOutlet.clickElement();

    // Move mouse in the active outlet.
    await activeOutlet.moveMouseToCenter();
    await activeOutlet.moveMouseToElement({offsetX: 10});
    await activeOutlet.moveMouseToElement({offsetY: 10});
    await activeOutlet.moveMouseToElement({offsetX: -10});
    await activeOutlet.moveMouseToElement({offsetY: -10});

    // Expect no mouse events to be dispatched.
    await expect(await activeOutlet.getReceivedEvents()).toEqual([]);
    await expect(await inactiveOutlet.getReceivedEvents()).toEqual([]);

    // Expect focus ownership not to have changed.
    await expect(await activeOutlet.hasFocus()).toBe(true);
    await expect(await inactiveOutlet.hasFocus()).toBe(false);
  });

  test('should not dispatch "sci-mousemove" events when moving the mouse in the inactive outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: MouseEventDispatchTestPagePO,
      inactiveOutlet: MouseEventDispatchTestPagePO,
    });

    const activeOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('inactiveOutlet');

    // Activate the outlet.
    await activeOutlet.clickElement();

    // Move mouse in the inactive outlet.
    await inactiveOutlet.moveMouseToCenter();
    await inactiveOutlet.moveMouseToElement({offsetX: 10});
    await inactiveOutlet.moveMouseToElement({offsetY: 10});
    await inactiveOutlet.moveMouseToElement({offsetX: -10});
    await inactiveOutlet.moveMouseToElement({offsetY: -10});

    // Expect no mouse events to be dispatched.
    await expect(await activeOutlet.getReceivedEvents()).toEqual([]);
    await expect(await inactiveOutlet.getReceivedEvents()).toEqual([]);

    // Expect focus ownership not to have changed.
    await expect(await activeOutlet.hasFocus()).toBe(true);
    await expect(await inactiveOutlet.hasFocus()).toBe(false);
  });

  test('should not dispatch "sci-mousemove" and "sci-mouseup" events when moving the mouse inside the active outlet and having the primary mouse button pressed', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: MouseEventDispatchTestPagePO,
      inactiveOutlet: MouseEventDispatchTestPagePO,
    });

    const activeOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('activeOutlet');
    const inactiveOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('inactiveOutlet');

    // Activate the outlet.
    await activeOutlet.clickElement();

    await test.step('mousedown.preventDefault=true', async () => {
      await activeOutlet.checkPreventDefaultOnMouseDown(true);
      // Move mouse to element in the active outlet.
      await activeOutlet.moveMouseToElement();
      // Press mouse button.
      await activeOutlet.mouseDown();
      // Move mouse around in the active outlet.
      await activeOutlet.moveMouseToElement({offsetX: 10});
      await activeOutlet.moveMouseToElement({offsetY: 10});
      await activeOutlet.moveMouseToElement({offsetX: -10});
      await activeOutlet.moveMouseToElement({offsetY: -10});
      // Release mouse button.
      await activeOutlet.mouseUp();

      // Expect no mouse events to be dispatched.
      await expect(await activeOutlet.getReceivedEvents()).toEqual([]);
      await expect(await inactiveOutlet.getReceivedEvents()).toEqual([]);

      // Expect focus ownership not to have changed.
      await expect(await activeOutlet.hasFocus()).toBe(true);
      await expect(await inactiveOutlet.hasFocus()).toBe(false);
    });

    await test.step('mousedown.preventDefault=false', async () => {
      await activeOutlet.checkPreventDefaultOnMouseDown(false);
      // Move mouse to element in the active outlet.
      await activeOutlet.moveMouseToElement();
      // Press mouse button.
      await activeOutlet.mouseDown();
      // Move mouse around in the active outlet.
      await activeOutlet.moveMouseToElement({offsetX: 10});
      await activeOutlet.moveMouseToElement({offsetY: 10});
      await activeOutlet.moveMouseToElement({offsetX: -10});
      await activeOutlet.moveMouseToElement({offsetY: -10});
      // Release mouse button.
      await activeOutlet.mouseUp();

      // Expect no mouse events to be dispatched.
      await expect(await activeOutlet.getReceivedEvents()).toEqual([]);
      await expect(await inactiveOutlet.getReceivedEvents()).toEqual([]);

      // Expect focus ownership not to have changed.
      await expect(await activeOutlet.hasFocus()).toBe(true);
      await expect(await inactiveOutlet.hasFocus()).toBe(false);
    });
  });

  test('should receive "sci-mousemove" and "sci-mouseup" events from inactive outlets only in the active outlet and having the primary mouse button pressed', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      activeOutlet: MouseEventDispatchTestPagePO,
      inactiveOutlet1: MouseEventDispatchTestPagePO,
      inactiveOutlet2: MouseEventDispatchTestPagePO,
    });

    const activeOutlet = pagePOs.get<MouseEventDispatchTestPagePO>('activeOutlet');
    const inactiveOutlet1 = pagePOs.get<MouseEventDispatchTestPagePO>('inactiveOutlet1');
    const inactiveOutlet2 = pagePOs.get<MouseEventDispatchTestPagePO>('inactiveOutlet2');

    // Activate the outlet.
    await activeOutlet.clickElement();

    await test.step('mousedown.preventDefault=true', async () => {
      await activeOutlet.checkPreventDefaultOnMouseDown(true);

      // Move mouse to element in the active outlet.
      await activeOutlet.moveMouseToElement();
      // Press mouse button.
      await activeOutlet.mouseDown();
      // Move mouse to the inactive outlet and move the mouse up and down.
      await inactiveOutlet1.moveMouseToCenter();
      await inactiveOutlet1.moveMouseToCenter({offsetX: 10});
      await inactiveOutlet1.moveMouseToCenter({offsetY: 10});
      await inactiveOutlet1.moveMouseToCenter({offsetX: -10});
      await inactiveOutlet1.moveMouseToCenter({offsetY: -10});
      await inactiveOutlet1.mouseUp();

      // Expect mousemove events to be transported to the active outlet only.
      await expect(await activeOutlet.getReceivedEvents()).toEqual(expect.arrayContaining(['sci-mousemove', 'sci-mouseup']));
      await expect(await inactiveOutlet1.getReceivedEvents()).toEqual([]);
      await expect(await inactiveOutlet2.getReceivedEvents()).toEqual([]);

      // Expect focus ownership not to have changed.
      await expect(await activeOutlet.hasFocus()).toBe(true);
      await expect(await inactiveOutlet1.hasFocus()).toBe(false);
      await expect(await inactiveOutlet2.hasFocus()).toBe(false);

      await activeOutlet.clearReceivedEvents();
    });

    await test.step('mousedown.preventDefault=false', async () => {
      await activeOutlet.checkPreventDefaultOnMouseDown(false);

      // Move mouse to element in the active outlet.
      await activeOutlet.moveMouseToElement();
      // Press mouse button.
      await activeOutlet.mouseDown();
      // Move mouse to the inactive outlet and move the mouse up and down.
      await inactiveOutlet1.moveMouseToCenter();
      await inactiveOutlet1.moveMouseToCenter({offsetX: 10});
      await inactiveOutlet1.moveMouseToCenter({offsetY: 10});
      await inactiveOutlet1.moveMouseToCenter({offsetX: -10});
      await inactiveOutlet1.moveMouseToCenter({offsetY: -10});
      await inactiveOutlet1.mouseUp();

      // Expect no mousemove events to be transported.
      await expect(await activeOutlet.getReceivedEvents()).toEqual([]);
      await expect(await inactiveOutlet1.getReceivedEvents()).toEqual([]);
      await expect(await inactiveOutlet2.getReceivedEvents()).toEqual([]);

      // Expect focus ownership not to have changed.
      await expect(await activeOutlet.hasFocus()).toBe(true);
      await expect(await inactiveOutlet1.hasFocus()).toBe(false);
      await expect(await inactiveOutlet2.hasFocus()).toBe(false);
    });
  });
});
