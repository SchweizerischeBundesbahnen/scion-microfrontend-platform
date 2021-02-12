/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { consumeBrowserLog, seleniumWebDriverClickFix, SeleniumWebDriverClickFix, sendKeys } from '../spec.util';
import { TestingAppPO } from '../testing-app.po';
import { BrowserOutletPO } from '../browser-outlet/browser-outlet.po';
import { Microfrontend1PagePO } from '../microfrontend/microfrontend-1-page.po';
import { Key, logging } from 'protractor';
import Level = logging.Level;

describe('KeyboardEvent', () => {

  let fix: SeleniumWebDriverClickFix;
  beforeAll(() => fix = seleniumWebDriverClickFix().install());
  afterAll(() => fix.uninstall());

  it('should receive keyboard events for the \'m\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.m',
      keysToPress: ['m'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.m',
      keysToPress: ['m'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'control.m\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.control.m',
      keysToPress: [Key.CONTROL, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.control.m',
      keysToPress: [Key.CONTROL, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'control.shift.m\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.control.shift.m',
      keysToPress: [Key.CONTROL, Key.SHIFT, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.control.shift.m',
      keysToPress: [Key.CONTROL, Key.SHIFT, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'control.shift.alt.m\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.control.shift.alt.m',
      keysToPress: [Key.CONTROL, Key.SHIFT, Key.ALT, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.control.shift.alt.m',
      keysToPress: [Key.CONTROL, Key.SHIFT, Key.ALT, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'control.shift.alt.meta.m\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.control.shift.alt.meta.m',
      keysToPress: [Key.CONTROL, Key.SHIFT, Key.ALT, Key.META, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=true]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.control.shift.alt.meta.m',
      keysToPress: [Key.CONTROL, Key.SHIFT, Key.ALT, Key.META, 'm'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='M', control=true, shift=true, alt=true, meta=true]`,
    ]));
  });

  it('should receive keyboard events for the \'dot\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.dot',
      keysToPress: ['.'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='.', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.dot',
      keysToPress: ['.'],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='.', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'space\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.space',
      keysToPress: [' '],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key=' ', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.space',
      keysToPress: [' '],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key=' ', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'escape\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.escape',
      keysToPress: [Key.ESCAPE],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='Escape', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.escape',
      keysToPress: [Key.ESCAPE],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='Escape', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'enter\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.enter',
      keysToPress: [Key.ENTER],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='Enter', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.enter',
      keysToPress: [Key.ENTER],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='Enter', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'f7\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.f7',
      keysToPress: [Key.F7],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='F7', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.f7',
      keysToPress: [Key.F7],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='F7', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events for the \'backspace\' keystroke', async () => {
    await setupAndPressKeystroke({
      keystrokeToRegister: 'keydown.backspace',
      keysToPress: [Key.BACK_SPACE],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='Backspace', control=false, shift=false, alt=false, meta=false]`,
    ]));

    await setupAndPressKeystroke({
      keystrokeToRegister: 'keyup.backspace',
      keysToPress: [Key.BACK_SPACE],
    });
    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeyup] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeyup] [SYNTHETIC] [outletContext=n/a, key='Backspace', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should receive keyboard events from nested microfrontends', async () => {
    const testingAppPO = new TestingAppPO();
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
    await pagePOs.get<BrowserOutletPO>('outlet1').setKeystrokesViaAttr('keydown.control.m');

    // Enter the keystroke in the lowermost microfrontend
    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.clickInputField();
    await sendKeys(Key.chord(Key.CONTROL, 'm'));

    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet3, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet2, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet1, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should not receive the keyboard events for a keystroke registered in a nested microfrontend', async () => {
    const testingAppPO = new TestingAppPO();
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
    await pagePOs.get<BrowserOutletPO>('outlet2').setKeystrokesViaAttr('keydown.control.m');

    // Enter the keystroke in the lowermost microfrontend
    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.clickInputField();
    await sendKeys(Key.chord(Key.CONTROL, 'm'));

    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet3, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet2, key='m', control=true, shift=false, alt=false, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=outlet1, key='m', control=true, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should not receive keyboard events for not registered keystrokes', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.setKeystrokesViaAttr('keydown.alt.x');

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.clickInputField();
    await sendKeys(Key.chord(Key.ALT, 'x'));
    await sendKeys(Key.chord(Key.ALT, 'v'));

    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='x', control=false, shift=false, alt=true, meta=false]`,
    ]));
  });

  it('should allow registering multiple keystrokes via <sci-router-outlet> attribute', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.setKeystrokesViaAttr('keydown.alt.x,keydown.alt.y,keydown.m');

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.clickInputField();
    await sendKeys(Key.chord(Key.ALT, 'x'));
    await sendKeys(Key.chord(Key.ALT, 'y'));
    await sendKeys(Key.chord('m'));

    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='x', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='y', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]));
  });

  it('should allow registering multiple keystrokes via <sci-router-outlet> DOM element', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      microfrontend: Microfrontend1PagePO,
    });

    const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
    await outletPO.setKeystrokesViaDom(['keydown.alt.x', 'keydown.alt.y', 'keydown.m']);

    const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
    await microfrontendPagePO.clickInputField();
    await sendKeys(Key.chord(Key.ALT, 'x'));
    await sendKeys(Key.chord(Key.ALT, 'y'));
    await sendKeys(Key.chord('m'));

    await expect(await consumeBrowserLog(Level.DEBUG, /AppComponent::document:onkeydown] \[SYNTHETIC]/)).toEqual(jasmine.arrayWithExactContents([
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='x', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='y', control=false, shift=false, alt=true, meta=false]`,
      `[AppComponent::document:onkeydown] [SYNTHETIC] [outletContext=n/a, key='m', control=false, shift=false, alt=false, meta=false]`,
    ]));
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
async function setupAndPressKeystroke(instructions: { keystrokeToRegister: string, keysToPress: string[] }): Promise<void> {
  const testingAppPO = new TestingAppPO();
  const pagePOs = await testingAppPO.navigateTo({
    microfrontend: Microfrontend1PagePO,
  });

  const outletPO = pagePOs.get<BrowserOutletPO>('microfrontend:outlet');
  await outletPO.setKeystrokesViaAttr(instructions.keystrokeToRegister);

  const microfrontendPagePO = pagePOs.get<Microfrontend1PagePO>('microfrontend');
  await microfrontendPagePO.clickInputField();
  await sendKeys(Key.chord(...instructions.keysToPress));
}
