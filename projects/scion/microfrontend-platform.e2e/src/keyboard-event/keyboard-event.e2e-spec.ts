/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestingAppPO} from '../testing-app.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {Microfrontend1PagePO} from '../microfrontend/microfrontend-1-page.po';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('KeyboardEvent', () => {

  test('should receive keyboard events for the \'m\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.m',
      keysToPress: ['m'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.m',
      keysToPress: ['m'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'control.m\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.control.m',
      keysToPress: ['Control', 'm'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.control.m',
      keysToPress: ['Control', 'm'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'control.shift.m\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.control.shift.m',
      keysToPress: ['Control', 'Shift', 'M'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.control.shift.m',
      keysToPress: ['Control', 'Shift', 'M'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'control.alt.shift.m\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.control.alt.shift.m',
      keysToPress: ['Control', 'Shift', 'Alt', 'M'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.control.alt.shift.m',
      keysToPress: ['Control', 'Shift', 'Alt', 'M'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'control.alt.shift.meta.m\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.control.alt.shift.meta.m',
      keysToPress: ['Control', 'Shift', 'Alt', 'Meta', 'M'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=true]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.control.alt.shift.meta.m',
      keysToPress: ['Control', 'Shift', 'Alt', 'Meta', 'M'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=true]`,
    ]);
  });

  test('should receive keyboard events for the \'dot\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.dot',
      keysToPress: ['.'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='.', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.dot',
      keysToPress: ['.'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='.', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'space\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.space',
      keysToPress: [' '],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key=' ', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.space',
      keysToPress: [' '],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key=' ', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'escape\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.escape',
      keysToPress: ['Escape'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='Escape', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.escape',
      keysToPress: ['Escape'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='Escape', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'enter\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.enter',
      keysToPress: ['Enter'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='Enter', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.enter',
      keysToPress: ['Enter'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='Enter', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'f7\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.f7',
      keysToPress: ['F7'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='F7', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.f7',
      keysToPress: ['F7'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='F7', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events for the \'backspace\' keystroke', async ({testingAppPO, consoleLogs}) => {
    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keydown.backspace',
      keysToPress: ['Backspace'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='Backspace', control=false, shift=false, alt=false, meta=false]`,
    ]);

    await setupAndPressKeystroke(testingAppPO, {
      keystrokeToRegister: 'keyup.backspace',
      keysToPress: ['Backspace'],
    });
    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeyup] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='Backspace', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should receive keyboard events from nested microfrontends', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });
    // Register the keystroke in the top-level outlet
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.m'], {registration: 'ATTR'});

    // Enter the keystroke in the lowermost microfrontend
    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+m');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet3, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet2, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet1, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should not receive the keyboard events for a keystroke registered in a nested microfrontend', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });
    // Register the keystroke in the middle outlet, but not in the parent
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.m'], {registration: 'ATTR'});

    // Enter the keystroke in the lowermost microfrontend
    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+m');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet3, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet2, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet1, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should not receive keyboard events for not registered keystrokes', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.alt.x'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Alt+x');
    await microfrontendPagePO.inputFieldPO.press('Alt+v');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='x', control=false, shift=false, alt=true, meta=false]`,
    ]);
  });

  test('should not prevent default action if keyboard flags not set', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=false]`,
    ]);
  });

  test('should not prevent default action if `preventDefault` is set to `false`', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=false]`,
    ]);
  });

  test('should prevent default action if `preventDefault` is set to `true`', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=true]`,
    ]);
  });

  test('should prevent default action if `preventDefault` is set to `true` in outlet3', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    await pagePOs.get<BrowserOutletPO>('microfrontend:outlet').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet3').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=true]`,
    ]);
  });

  test('should prevent default action if `preventDefault` is set to `true` in outlet2', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    await pagePOs.get<BrowserOutletPO>('microfrontend:outlet').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet3').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=true]`,
    ]);
  });

  test('should prevent default action if `preventDefault` is set to `true` in outlet1', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    await pagePOs.get<BrowserOutletPO>('microfrontend:outlet').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet3').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=true]`,
    ]);
  });

  test('should not prevent default action if `preventDefault` is set to `false` in outlet3', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    await pagePOs.get<BrowserOutletPO>('microfrontend:outlet').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet3').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=false]`,
    ]);
  });

  test('should not prevent default action if `preventDefault` is set to `false` in outlet2', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    await pagePOs.get<BrowserOutletPO>('microfrontend:outlet').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet3').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=true}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=false]`,
    ]);
  });

  test('should not prevent default action if `preventDefault` is set to `false` in outlet1', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            microfrontend: Microfrontend1PagePO,
          },
        },
      },
    });

    await pagePOs.get<BrowserOutletPO>('microfrontend:outlet').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet3').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet2').registerKeystrokes(['keydown.control.alt.shift.s'], {registration: 'ATTR'});
    await pagePOs.get<BrowserOutletPO>('outlet1').registerKeystrokes(['keydown.control.alt.shift.s{preventDefault=false}'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Control+Alt+Shift+S');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[TRUSTED]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [TRUSTED] [outletContext=microfrontend, key='S', control=true, shift=true, alt=true, meta=false, defaultPrevented=false]`,
    ]);
  });

  test('should unsubscribe keyboard event handlers when keystrokes change, thus avoiding subscription leaks', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.alt.x'], {registration: 'ATTR'});
    await outletPO.registerKeystrokes(['keydown.alt.y'], {registration: 'ATTR'}); // override the keystroke above by this one

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Alt+x');
    await microfrontendPagePO.inputFieldPO.press('Alt+y');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='y', control=false, shift=false, alt=true, meta=false]`,
    ]);
  });

  test('should allow registering multiple keystrokes via <sci-router-outlet> attribute', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.alt.x', 'keydown.alt.y', 'keydown.m'], {registration: 'ATTR'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Alt+x');
    await microfrontendPagePO.inputFieldPO.press('Alt+y');
    await microfrontendPagePO.inputFieldPO.press('m');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='x', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='y', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });

  test('should allow registering multiple keystrokes via <sci-router-outlet> DOM element', async ({testingAppPO, consoleLogs}) => {
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.registerKeystrokes(['keydown.alt.x', 'keydown.alt.y', 'keydown.m'], {registration: 'DOM'});

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.inputFieldPO.press('Alt+x');
    await microfrontendPagePO.inputFieldPO.press('Alt+y');
    await microfrontendPagePO.inputFieldPO.press('m');

    await expect(await consoleLogs.get({severity: 'debug', filter: /AppComponent::document:onkeydown] \[SYNTHETIC]/})).toEqualIgnoreOrder([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='x', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='y', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]);
  });
});

/**
 * Does the following steps:
 *
 * 1. Starts the testing app
 * 2. Embeds a microfrontend
 * 3. Registers the passed keystroke for propagation on the outlet
 * 4. Presses passed keys in the embedded microfrontend
 */
async function setupAndPressKeystroke(testingAppPO: TestingAppPO, instructions: {keystrokeToRegister: string; keysToPress: string[]}): Promise<void> {
  const pagePOs = await testingAppPO.navigateTo({
    microfrontend: Microfrontend1PagePO,
  });

  const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
  await outletPO.registerKeystrokes([instructions.keystrokeToRegister], {registration: 'ATTR'});

  const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
  await microfrontendPagePO.inputFieldPO.press(instructions.keysToPress.join('+'));
}
