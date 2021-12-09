/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {TestingAppPO} from '../testing-app.po';
import {ContextPagePO} from './context-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {consumeBrowserLog, expectMap} from '../spec.util';
import {browser} from 'protractor';
import {LookupContextValuePagePO} from './lookup-context-value-page.po';
import {installSeleniumWebDriverClickFix} from '../selenium-webdriver-click-fix';

describe('Context', () => {

  installSeleniumWebDriverClickFix();

  it('should be a noop when looking up a context value outside of an outlet context', async () => {
    await browser.get(`/#/${LookupContextValuePagePO.pageUrl}`);
    const lookupContextValuePO = new LookupContextValuePagePO((): Promise<void> => browser.switchTo().defaultContent() as Promise<void>);
    await lookupContextValuePO.enterKey('name');
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toBeNull();
    await expect(await lookupContextValuePO.getObservedValue()).toBeNull();
    await expect(await consumeBrowserLog()).toEqual([]);
  });

  it('should be a noop when collecting context values outside of an outlet context', async () => {
    await browser.get(`/#/${LookupContextValuePagePO.pageUrl}`);
    const lookupContextValuePO = new LookupContextValuePagePO((): Promise<void> => browser.switchTo().defaultContent() as Promise<void>);
    await lookupContextValuePO.enterKey('name');
    await lookupContextValuePO.toggleCollectValues(true);
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toEqual([]);
    await expect(await lookupContextValuePO.getObservedValue()).toEqual([]);
    await expect(await consumeBrowserLog()).toEqual([]);
  });

  it('should allow setting a context value', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const outlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue('key', 'value');
    await outlet.outletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value');
  });

  it('should allow setting a context key name containing forward slashes', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const outlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue('a/b/c', 'value');
    await outlet.outletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('a/b/c')).toEqual('value');
  });

  it('should allow setting a context key name starting with a colon', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const outlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue(':key', 'value');
    await outlet.outletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue(':key')).toEqual('value');
  });

  it('should allow removing a context value', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const outlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue('key', 'value');
    await outlet.outletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value');

    await outlet.outletContextPO.open();
    await outlet.outletContextPO.removeContextValue('key');
    await outlet.outletContextPO.close();

    await expect(await lookupContextValuePO.lookupValue('key')).toBeNull();
  });

  it('should allow updating a context value', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const outlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue('key', 'value-1');
    await outlet.outletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await lookupContextValuePO.enterKey('key');
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toEqual('value-1');
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');

    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue('key', 'value-2');
    await outlet.outletContextPO.close();

    await expect(await lookupContextValuePO.getLookedUpValue()).toEqual('value-1');
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');
  });

  it('should allow setting multiple values to the context of an outlet', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const outlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet.outletContextPO.open();
    await outlet.outletContextPO.addContextValue('key1', 'value1');
    await outlet.outletContextPO.addContextValue('key2', 'value2');
    await outlet.outletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('key1')).toEqual('value1');
    await expect(await lookupContextValuePO.lookupValue('key2')).toEqual('value2');
  });

  it('should allow observing a context value', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await lookupContextValuePO.enterKey('key');
    await lookupContextValuePO.clickSubscribe();
    await expect(await lookupContextValuePO.getObservedValue()).toBeNull();

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-1');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');

    const outlet3 = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.addContextValue('key', 'value-3');
    await outlet3.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-3');
  });

  it('should allow looking up a context value', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('key')).toBeNull();

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-1');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');

    const outlet3 = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.addContextValue('key', 'value-3');
    await outlet3.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-3');
  });

  it('should allow observing all available context values', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: ContextPagePO,
          },
        },
      },
    });

    const contextPagePO = pagePOs.get<ContextPagePO>('context');

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-1');
    await outlet1.outletContextPO.addContextValue('outlet-1-key', 'outlet-1-value');
    await outlet1.outletContextPO.close();
    await expectMap(contextPagePO.getContext()).toContain(new Map()
      .set('key', 'value-1')
      .set('outlet-1-key', 'outlet-1-value'),
    );

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.addContextValue('outlet-2-key', 'outlet-2-value');
    await outlet2.outletContextPO.close();
    await expectMap(contextPagePO.getContext()).toContain(new Map()
      .set('key', 'value-2')
      .set('outlet-1-key', 'outlet-1-value')
      .set('outlet-2-key', 'outlet-2-value'),
    );

    const outlet3 = pagePOs.get<BrowserOutletPO>('outlet3');
    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.addContextValue('key', 'value-3');
    await outlet3.outletContextPO.addContextValue('outlet-3-key', 'outlet-3-value');
    await outlet3.outletContextPO.close();
    await expectMap(contextPagePO.getContext()).toContain(new Map()
      .set('key', 'value-3')
      .set('outlet-1-key', 'outlet-1-value')
      .set('outlet-2-key', 'outlet-2-value')
      .set('outlet-3-key', 'outlet-3-value'),
    );
  });

  it('should inherit context values from parent contexts', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: LookupContextValuePagePO,
        },
        outlet4: LookupContextValuePagePO,
      },
    });

    const rootOutlet = pagePOs.get<BrowserOutletPO>('outlet1');
    await rootOutlet.outletContextPO.open();
    await rootOutlet.outletContextPO.addContextValue('key', 'root-value');
    await rootOutlet.outletContextPO.close();

    const lookupContextValueOutlet3PO = pagePOs.get<LookupContextValuePagePO>('outlet3');
    await expect(await lookupContextValueOutlet3PO.lookupValue('key')).toEqual('root-value');

    const lookupContextValueOutlet4PO = pagePOs.get<LookupContextValuePagePO>('outlet4');
    await expect(await lookupContextValueOutlet4PO.lookupValue('key')).toEqual('root-value');
  });

  it('should allow overriding context values', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          context: LookupContextValuePagePO,
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-1');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');

    const contextOutlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await contextOutlet.outletContextPO.open();
    await contextOutlet.outletContextPO.addContextValue('key', 'value-3');
    await contextOutlet.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-3');
  });

  it('should collect context values in context-descending order (lookup)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    const contextOutlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await contextOutlet.outletContextPO.open();
    await contextOutlet.outletContextPO.addContextValue('key', 'value-1');
    await contextOutlet.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-1']);

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-1', 'value-2']);

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-3');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-1', 'value-2', 'value-3']);
  });

  it('should collect context values in context-descending order (observe)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await lookupContextValuePO.enterKey('key');
    await lookupContextValuePO.toggleCollectValues(true);
    await lookupContextValuePO.clickSubscribe();

    const contextOutlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await contextOutlet.outletContextPO.open();
    await contextOutlet.outletContextPO.addContextValue('key', 'value-1');
    await contextOutlet.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual(['value-1']);

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual(['value-1', 'value-2']);

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-3');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual(['value-1', 'value-2', 'value-3']);
  });

  it('should collect empty context values', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    const contextOutlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await contextOutlet.outletContextPO.open();
    await contextOutlet.outletContextPO.addContextValue('key', '');
    await contextOutlet.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['']);

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['', 'value-2']);

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-3');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['', 'value-2', 'value-3']);
  });

  it('should collect `null` context values', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    const contextOutlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await contextOutlet.outletContextPO.open();
    await contextOutlet.outletContextPO.addContextValue('key', null);
    await contextOutlet.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([null]);

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([null, 'value-2']);

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-3');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([null, 'value-2', 'value-3']);
  });

  it('should return `null` if no value is associated anywhere in the context hierarchy', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await lookupContextValuePO.enterKey('key');
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toBeNull();
    await expect(await lookupContextValuePO.getObservedValue()).toBeNull();
  });

  it('should return an empty array when collecting values but if no value is associated anywhere in the context hierarchy', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await lookupContextValuePO.enterKey('key');
    await lookupContextValuePO.toggleCollectValues(true);
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toEqual([]);
    await expect(await lookupContextValuePO.getObservedValue()).toEqual([]);
  });

  it('should ignore `undefined` context values when collecting', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: {
            context: LookupContextValuePagePO,
          },
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    const contextOutlet = pagePOs.get<BrowserOutletPO>('context:outlet');
    await contextOutlet.outletContextPO.open();
    await contextOutlet.outletContextPO.addContextValue('key', undefined);
    await contextOutlet.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([]);

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-2']);

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-3');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-2', 'value-3']);
  });

  it('should reflect the deletion of inherited context values (lookup)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          context: LookupContextValuePagePO,
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-1');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');

    const outlet3 = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.addContextValue('key', 'value-3');
    await outlet3.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-3');

    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.removeContextValue('key');
    await outlet3.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');

    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.removeContextValue('key');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');

    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.removeContextValue('key');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.lookupValue('key')).toBeNull();
  });

  it('should reflect the deletion of inherited context values (observe)', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          context: LookupContextValuePagePO,
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await lookupContextValuePO.enterKey('key');
    await lookupContextValuePO.clickSubscribe();

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key', 'value-1');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key', 'value-2');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');

    const outlet3 = pagePOs.get<BrowserOutletPO>('context:outlet');
    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.addContextValue('key', 'value-3');
    await outlet3.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-3');

    await outlet3.outletContextPO.open();
    await outlet3.outletContextPO.removeContextValue('key');
    await outlet3.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');

    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.removeContextValue('key');
    await outlet2.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');

    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.removeContextValue('key');
    await outlet1.outletContextPO.close();
    await expect(await lookupContextValuePO.getObservedValue()).toBeNull();
  });

  it('should not leak context values to sibling contexts', async () => {
    const testingAppPO = new TestingAppPO();
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: LookupContextValuePagePO,
      outlet2: LookupContextValuePagePO,
    });

    const outlet1 = pagePOs.get<BrowserOutletPO>('outlet1:outlet');
    await outlet1.outletContextPO.open();
    await outlet1.outletContextPO.addContextValue('key1', 'value1');
    await outlet1.outletContextPO.close();

    const outlet2 = pagePOs.get<BrowserOutletPO>('outlet2:outlet');
    await outlet2.outletContextPO.open();
    await outlet2.outletContextPO.addContextValue('key2', 'value2');
    await outlet2.outletContextPO.close();

    const lookupContextValueOutlet1PO = pagePOs.get<LookupContextValuePagePO>('outlet1');
    await expect(await lookupContextValueOutlet1PO.lookupValue('key1')).toEqual('value1');
    await expect(await lookupContextValueOutlet1PO.lookupValue('key2')).toBeNull();

    const lookupContextValueOutlet2PO = pagePOs.get<LookupContextValuePagePO>('outlet2');
    await expect(await lookupContextValueOutlet2PO.lookupValue('key1')).toBeNull();
    await expect(await lookupContextValueOutlet2PO.lookupValue('key2')).toEqual('value2');
  });
});

