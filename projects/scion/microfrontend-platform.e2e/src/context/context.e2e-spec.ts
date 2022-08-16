/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ContextPagePO} from './context-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {LookupContextValuePagePO} from './lookup-context-value-page.po';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('Context', () => {

  test('should be a noop when looking up a context value outside of an outlet context', async ({page}) => {
    await page.goto(`/#/${LookupContextValuePagePO.PATH}`);

    const lookupContextValuePO = new LookupContextValuePagePO(page);
    await lookupContextValuePO.enterKey('name');
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toBeNull();
    await expect(await lookupContextValuePO.getObservedValue()).toBeNull();
  });

  test('should be a noop when collecting context values outside of an outlet context', async ({page}) => {
    await page.goto(`/#/${LookupContextValuePagePO.PATH}`);

    const lookupContextValuePO = new LookupContextValuePagePO(page);
    await lookupContextValuePO.enterKey('name');
    await lookupContextValuePO.toggleCollectValues(true);
    await lookupContextValuePO.clickSubscribe();

    await expect(await lookupContextValuePO.getLookedUpValue()).toEqual([]);
    await expect(await lookupContextValuePO.getObservedValue()).toEqual([]);
  });

  test('should allow setting a context value', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
    const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
    await routerOutletContextPO.addContextValue('key', 'value');
    await routerOutletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value');
  });

  test('should allow setting a context key name containing forward slashes', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
    const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
    await routerOutletContextPO.addContextValue('a/b/c', 'value');
    await routerOutletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('a/b/c')).toEqual('value');
  });

  test('should allow setting a context key name starting with a colon', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
    const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
    await routerOutletContextPO.addContextValue(':key', 'value');
    await routerOutletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue(':key')).toEqual('value');
  });

  test('should allow removing a context value', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await test.step('adding context value [key=value] to outlet "context"', async () => {
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value');
    });
    await test.step('removing context value [key=value] from outlet "context"', async () => {
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toBeNull();
    });
  });

  test('should allow updating a context value', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await test.step('adding context value [key=value-1] to outlet "context"', async () => {
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await lookupContextValuePO.enterKey('key');
      await lookupContextValuePO.clickSubscribe();

      await expect(await lookupContextValuePO.getLookedUpValue()).toEqual('value-1');
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');
    });
    await test.step('updating context value [key=value-2] of outlet "context"', async () => {
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getLookedUpValue()).toEqual('value-1');
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');
    });
  });

  test('should allow setting multiple values to the context of an outlet', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      context: LookupContextValuePagePO,
    });

    const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
    const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
    await routerOutletContextPO.addContextValue('key1', 'value1');
    await routerOutletContextPO.addContextValue('key2', 'value2');
    await routerOutletContextPO.close();

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await expect(await lookupContextValuePO.lookupValue('key1')).toEqual('value1');
    await expect(await lookupContextValuePO.lookupValue('key2')).toEqual('value2');
  });

  test('should allow observing a context value', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=value-1] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');
    });
    await test.step('adding context value [key=value-3] to outlet "outlet3"', async () => {
      const outlet3BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet3');
      const routerOutletContextPO = await outlet3BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-3');
    });
    await test.step('adding context value [key=value-4] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-4');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-4');
    });
  });

  test('should allow looking up a context value', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=value-1] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');
    });
    await test.step('adding context value [key=value-3] to outlet "outlet3"', async () => {
      const outlet3BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet3');
      const routerOutletContextPO = await outlet3BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-3');
    });
    await test.step('adding context value [key=value-4] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-4');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-4');
    });
  });

  test('should allow observing all available context values', async ({testingAppPO}) => {
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
    await test.step('adding context values [key=value-1] and [outlet-1-key=outlet-1-value] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.addContextValue('outlet-1-key', 'outlet-1-value');
      await routerOutletContextPO.close();
      await expect(await contextPagePO.getContext()).toEqual(expect.objectContaining({
        'key': 'value-1',
        'outlet-1-key': 'outlet-1-value',
      }));
    });
    await test.step('adding context values [key=value-2] and [outlet-2-key=outlet-2-value] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.addContextValue('outlet-2-key', 'outlet-2-value');
      await routerOutletContextPO.close();
      await expect(await contextPagePO.getContext()).toEqual(expect.objectContaining({
        'key': 'value-2',
        'outlet-1-key': 'outlet-1-value',
        'outlet-2-key': 'outlet-2-value',
      }));
    });
    await test.step('adding context values [key=value-3] and [outlet-3-key=outlet-3-value] to outlet "outlet3"', async () => {
      const outlet3BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet3');
      const routerOutletContextPO = await outlet3BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.addContextValue('outlet-3-key', 'outlet-3-value');
      await routerOutletContextPO.close();
      await expect(await contextPagePO.getContext()).toEqual(expect.objectContaining({
        'key': 'value-3',
        'outlet-1-key': 'outlet-1-value',
        'outlet-2-key': 'outlet-2-value',
        'outlet-3-key': 'outlet-3-value',
      }));
    });
  });

  test('should inherit context values from parent contexts', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          outlet3: LookupContextValuePagePO,
        },
        outlet4: LookupContextValuePagePO,
      },
    });

    const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
    const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
    await routerOutletContextPO.addContextValue('key', 'root-value');
    await routerOutletContextPO.close();

    const lookupContextValueOutlet3PO = pagePOs.get<LookupContextValuePagePO>('outlet3');
    await expect(await lookupContextValueOutlet3PO.lookupValue('key')).toEqual('root-value');

    const lookupContextValueOutlet4PO = pagePOs.get<LookupContextValuePagePO>('outlet4');
    await expect(await lookupContextValueOutlet4PO.lookupValue('key')).toEqual('root-value');
  });

  test('should allow overriding context values', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          context: LookupContextValuePagePO,
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');
    await test.step('adding context value [key=value-1] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');
    });
    await test.step('adding context value [key=value-3] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-3');
    });
  });

  test('should collect context values in context-descending order (lookup)', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=value-1] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-1']);
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-1', 'value-2']);
    });
    await test.step('adding context value [key=value-3] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-1', 'value-2', 'value-3']);
    });
  });

  test('should collect context values in context-descending order (observe)', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=value-1] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual(['value-1']);
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual(['value-1', 'value-2']);
    });
    await test.step('adding context value [key=value-3] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual(['value-1', 'value-2', 'value-3']);
    });
  });

  test('should collect empty context values', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=""] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', '');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['']);
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['', 'value-2']);
    });
    await test.step('adding context value [key=value-3] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['', 'value-2', 'value-3']);
    });
  });

  test('should collect `null` context values', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=null] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', null);
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([null]);
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([null, 'value-2']);
    });
    await test.step('adding context value [key=value-3] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([null, 'value-2', 'value-3']);
    });
  });

  test('should return `null` if no value is associated anywhere in the context hierarchy', async ({testingAppPO}) => {
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

  test('should return an empty array when collecting values but if no value is associated anywhere in the context hierarchy', async ({testingAppPO}) => {
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

  test('should ignore `undefined` context values when collecting', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=undefined] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', undefined);
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual([]);
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-2']);
    });
    await test.step('adding context value [key=value-3] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key', {collect: true})).toEqual(['value-2', 'value-3']);
    });
  });

  test('should reflect the deletion of inherited context values (lookup)', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: {
        outlet2: {
          context: LookupContextValuePagePO,
        },
      },
    });

    const lookupContextValuePO = pagePOs.get<LookupContextValuePagePO>('context');

    await test.step('adding context value [key=value-1] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');
    });
    await test.step('adding context value [key=value-3] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-3');
    });
    await test.step('removing context value [key=value-3] from outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-2');
    });
    await test.step('removing context value [key=value-2] from outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toEqual('value-1');
    });
    await test.step('removing context value [key=value-1] from outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.lookupValue('key')).toBeNull();
    });
  });

  test('should reflect the deletion of inherited context values (observe)', async ({testingAppPO}) => {
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

    await test.step('adding context value [key=value-1] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-1');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');
    });
    await test.step('adding context value [key=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-2');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');
    });
    await test.step('adding context value [key=value-3] to outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key', 'value-3');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-3');
    });
    await test.step('removing context value [key=value-3] from outlet "context"', async () => {
      const contextBrowserOutletPO = pagePOs.get<BrowserOutletPO>('context:outlet');
      const routerOutletContextPO = await contextBrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-2');
    });
    await test.step('removing context value [key=value-2] from outlet "outlet"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toEqual('value-1');
    });
    await test.step('removing context value [key=value-1] from outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.removeContextValue('key');
      await routerOutletContextPO.close();
      await expect(await lookupContextValuePO.getObservedValue()).toBeNull();
    });
  });

  test('should not leak context values to sibling contexts', async ({testingAppPO}) => {
    const pagePOs = await testingAppPO.navigateTo({
      outlet1: LookupContextValuePagePO,
      outlet2: LookupContextValuePagePO,
    });

    await test.step('adding context value [key1=value-1] to outlet "outlet1"', async () => {
      const outlet1BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet1:outlet');
      const routerOutletContextPO = await outlet1BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key1', 'value1');
      await routerOutletContextPO.close();
    });
    await test.step('adding context value [key2=value-2] to outlet "outlet2"', async () => {
      const outlet2BrowserOutletPO = pagePOs.get<BrowserOutletPO>('outlet2:outlet');
      const routerOutletContextPO = await outlet2BrowserOutletPO.openRouterOutletContext();
      await routerOutletContextPO.addContextValue('key2', 'value2');
      await routerOutletContextPO.close();
    });

    const lookupContextValueOutlet1PO = pagePOs.get<LookupContextValuePagePO>('outlet1');
    await expect(await lookupContextValueOutlet1PO.lookupValue('key1')).toEqual('value1');
    await expect(await lookupContextValueOutlet1PO.lookupValue('key2')).toBeNull();

    const lookupContextValueOutlet2PO = pagePOs.get<LookupContextValuePagePO>('outlet2');
    await expect(await lookupContextValueOutlet2PO.lookupValue('key1')).toBeNull();
    await expect(await lookupContextValueOutlet2PO.lookupValue('key2')).toEqual('value2');
  });
});

