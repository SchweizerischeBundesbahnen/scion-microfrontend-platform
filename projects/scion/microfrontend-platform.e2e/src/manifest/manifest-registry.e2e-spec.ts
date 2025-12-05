/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestingAppOrigins} from '../testing-app.po';
import {RegisterCapabilityPagePO} from './register-capability-page.po';
import {LookupCapabilityPagePO} from './lookup-capability-page.po';
import {RegisterIntentionPagePO} from './register-intention-page.po';
import {LookupIntentionPagePO} from './lookup-intention-page.po';
import {test} from '../fixtures';
import {expect} from '@playwright/test';

test.describe('Manifest Registry', () => {

  test.describe('Register capabilities', () => {

    test('should allow to register a capability', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register the capability
      const capabilityId = await registratorPO.registerCapability({type: 'type', qualifier: {key: 'value'}, private: true});

      // Verify registration
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capabilityId]);
    });
  });

  test.describe('Unregister capabilities', () => {

    test('should allow to unregister a capability by id', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type', qualifier: {key: 'value1'}, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type', qualifier: {key: 'value2'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id]);

      // Unregister capability1
      await registratorPO.unregisterCapability({id: capability1Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability2Id]);

      // Unregister capability2
      await registratorPO.unregisterCapability({id: capability2Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([]);
    });

    test('should allow to unregister a capability by type', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'value1'}, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'value2'}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'value1'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'value2'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id]);

      // Unregister by 'type1'
      await registratorPO.unregisterCapability({type: 'type1'});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability3Id, capability4Id]);

      // Unregister by 'type2'
      await registratorPO.unregisterCapability({type: 'type2'});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([]);
    });

    test('should allow to unregister a capability by qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: undefined, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'a'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type4', qualifier: {key: 'b'}, private: true});
      const capability5Id = await registratorPO.registerCapability({type: 'type5', qualifier: {key: 'c'}, private: true});
      const capability6Id = await registratorPO.registerCapability({type: 'type6', qualifier: {key: 'c'}, private: true});
      const capability7Id = await registratorPO.registerCapability({type: 'type7', qualifier: {key: 'd'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id, capability5Id, capability6Id, capability7Id]);

      // Unregister by qualifier {}
      await registratorPO.unregisterCapability({qualifier: {}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability3Id, capability4Id, capability5Id, capability6Id, capability7Id]);

      // Unregister by qualifier {key: 'a'}
      await registratorPO.unregisterCapability({qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability4Id, capability5Id, capability6Id, capability7Id]);

      // Unregister by qualifier {key: 'b'}
      await registratorPO.unregisterCapability({qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability5Id, capability6Id, capability7Id]);

      // Unregister by qualifier {key: 'c'}
      await registratorPO.unregisterCapability({qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability7Id]);

      // Unregister by qualifier {key: 'd'}
      await registratorPO.unregisterCapability({qualifier: {key: 'd'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([]);
    });

    test('should allow to unregister a capability by type and qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'b'}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'a'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: true});
      const capability5Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'a'}, private: true});
      const capability6Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'b'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id, capability5Id, capability6Id]);

      // Unregister by type 'type1' and qualifier {key: 'a'}
      await registratorPO.unregisterCapability({type: 'type1', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability2Id, capability3Id, capability4Id, capability5Id, capability6Id]);

      // Unregister by type 'type1' and qualifier {key: 'b'}
      await registratorPO.unregisterCapability({type: 'type1', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability3Id, capability4Id, capability5Id, capability6Id]);

      // Unregister by type 'type2' and qualifier {key: 'a'}
      await registratorPO.unregisterCapability({type: 'type2', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability4Id, capability5Id, capability6Id]);

      // Unregister by type 'type2' and qualifier {key: 'b'}
      await registratorPO.unregisterCapability({type: 'type2', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability5Id, capability6Id]);

      // Unregister by type 'type3' and qualifier {key: 'a'}
      await registratorPO.unregisterCapability({type: 'type3', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability6Id]);

      // Unregister by type 'type3' and qualifier {key: 'b'}
      await registratorPO.unregisterCapability({type: 'type3', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([]);
    });

    test('should allow to unregister capabilities by qualifier containing wildcard (*) value', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: undefined, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'a'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type4', qualifier: {key: 'b'}, private: true});
      const capability5Id = await registratorPO.registerCapability({type: 'type5', qualifier: {key: 'c'}, private: true});
      const capability6Id = await registratorPO.registerCapability({type: 'type6', qualifier: {otherKey: 'a'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id, capability5Id, capability6Id]);

      // Unregister by qualifier {key: '*'}
      await registratorPO.unregisterCapability({qualifier: {key: '*'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability6Id]);
    });

    test('should allow to unregister all capabilities by `AnyQualifier`', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: undefined, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'a'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type4', qualifier: {key: 'b'}, private: true});
      const capability5Id = await registratorPO.registerCapability({type: 'type5', qualifier: {key: 'c'}, private: true});
      const capability6Id = await registratorPO.registerCapability({type: 'type6', qualifier: {otherKey: 'a'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id, capability5Id, capability6Id]);

      // Unregister by qualifier {'*': '*'}
      await registratorPO.unregisterCapability({qualifier: {'*': '*'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([]);
    });

    test('should not allow to unregister capabilities if qualifier key is missing in filter', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: undefined, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'a', otherKey: 'z'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type4', qualifier: {key: 'b', otherKey: 'y'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id]);

      // Unregister by qualifier {key: '*'}
      await registratorPO.unregisterCapability({qualifier: {key: '*'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id]);

      // Unregister by qualifier {'*': '*'}
      await registratorPO.unregisterCapability({qualifier: {'*': '*'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([]);
    });

    test('should not allow to unregister capabilities if filter contains additional qualifier key', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: undefined, private: true});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {}, private: true});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'a'}, private: true});
      const capability4Id = await registratorPO.registerCapability({type: 'type4', qualifier: {key: 'b'}, private: true});
      const capability5Id = await registratorPO.registerCapability({type: 'type5', qualifier: {key: 'c'}, private: true});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id, capability5Id]);

      // Unregister by qualifier {key: '*', otherKey: '*'}
      await registratorPO.unregisterCapability({qualifier: {key: '*', otherKey: '*'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id, capability4Id, capability5Id]);
    });

    test('should not allow to unregister capabilities from other applications', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator_app2: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2},
        registrator_app3: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3},
        lookup_app2: {useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_2},
        lookup_app3: {useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_3},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorApp2PO = pagePOs.get<RegisterCapabilityPagePO>('registrator_app2');
      const registratorApp3PO = pagePOs.get<RegisterCapabilityPagePO>('registrator_app3');
      const lookupApp2PO = pagePOs.get<LookupCapabilityPagePO>('lookup_app2');
      const lookupApp3PO = pagePOs.get<LookupCapabilityPagePO>('lookup_app3');

      // Register capabilities
      const capabilityApp2Id = await registratorApp2PO.registerCapability({type: 'type', qualifier: {key: 'value'}, private: false});
      const capabilityApp3Id = await registratorApp3PO.registerCapability({type: 'type', qualifier: {key: 'value'}, private: false});

      await lookupApp2PO.lookup();
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([capabilityApp2Id]);
      await lookupApp3PO.lookup();
      await expect.poll(() => lookupApp3PO.getLookedUpCapabilityIds()).toEqual([capabilityApp3Id]);

      // Unregister the capability in 'app-2'
      await registratorApp2PO.unregisterCapability({type: 'type', qualifier: {key: 'value'}});
      await registratorApp2PO.unregisterCapability({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-2'});
      await registratorApp2PO.unregisterCapability({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-3'});
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([]);
      await expect.poll(() => lookupApp3PO.getLookedUpCapabilityIds()).toEqual([capabilityApp3Id]);

      // Unregister the capability in 'app-3'
      await registratorApp3PO.unregisterCapability({type: 'type', qualifier: {key: 'value'}});
      await registratorApp3PO.unregisterCapability({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-2'});
      await registratorApp3PO.unregisterCapability({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-3'});
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([]);
      await expect.poll(() => lookupApp3PO.getLookedUpCapabilityIds()).toEqual([]);
    });
  });

  test.describe('Lookup capabilities', () => {

    test('should allow to look up capabilities of the requesting application', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator_app1: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_1},
        registrator_app3: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3},
        lookup_app1: {useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_1},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorApp1PO = pagePOs.get<RegisterCapabilityPagePO>('registrator_app1');
      const registratorApp3PO = pagePOs.get<RegisterCapabilityPagePO>('registrator_app3');
      const lookupApp1PO = pagePOs.get<LookupCapabilityPagePO>('lookup_app1');

      // Register capabilities in 'app-1'
      const capability1Id = await registratorApp1PO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: false});
      const capability2Id = await registratorApp1PO.registerCapability({type: 'type1', qualifier: {key: 'b'}, private: false});
      const capability3Id = await registratorApp1PO.registerCapability({type: 'type1', qualifier: {key: 'c'}, private: false});

      // Register capabilities in 'app-2'
      await registratorApp3PO.registerCapability({type: 'type2', qualifier: {key: 'a'}, private: false});
      await registratorApp3PO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: false});
      await registratorApp3PO.registerCapability({type: 'type2', qualifier: {key: 'c'}, private: false});

      // Verify the lookup when setting the app explicitly via filter
      await lookupApp1PO.lookup({appSymbolicName: 'app-1'});
      await expect.poll(() => lookupApp1PO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id]);
    });

    test('should allow to look up capabilities by id', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: false});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: false});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'c'}, private: false});

      // Lookup capability 1
      await lookupPO.lookup({id: capability1Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability1Id]);

      // Lookup capability 2
      await lookupPO.lookup({id: capability2Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability2Id]);

      // Lookup capability 3
      await lookupPO.lookup({id: capability3Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability3Id]);
    });

    test('should allow to look up capabilities by type', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: false});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: false});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'c'}, private: false});

      // Lookup capability 1
      await lookupPO.lookup({type: 'type1'});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability1Id]);

      // Lookup capability 2
      await lookupPO.lookup({type: 'type2'});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability2Id]);

      // Lookup capability 3
      await lookupPO.lookup({type: 'type3'});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability3Id]);
    });

    test('should allow to look up capabilities by qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: false});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: false});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'c'}, private: false});

      // Lookup capability 1
      await lookupPO.lookup({qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability1Id]);

      // Lookup capability 2
      await lookupPO.lookup({qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability2Id]);

      // Lookup capability 3
      await lookupPO.lookup({qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability3Id]);
    });

    test('should allow to look up capabilities by type and qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');

      // Register capabilities
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: false});
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: false});
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'c'}, private: false});
      const capability4Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'd'}, private: false});
      const capability5Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'e'}, private: false});
      const capability6Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'f'}, private: false});

      // Lookup capability 1
      await lookupPO.lookup({type: 'type1', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability1Id]);

      // Lookup capability 2
      await lookupPO.lookup({type: 'type2', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability2Id]);

      // Lookup capability 3
      await lookupPO.lookup({type: 'type3', qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability3Id]);

      // Lookup capability 4
      await lookupPO.lookup({type: 'type1', qualifier: {key: 'd'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability4Id]);

      // Lookup capability 5
      await lookupPO.lookup({type: 'type2', qualifier: {key: 'e'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability5Id]);

      // Lookup capability 6
      await lookupPO.lookup({type: 'type3', qualifier: {key: 'f'}});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability6Id]);
    });

    test('should allow to look up public capabilities from other apps for which the requesting app has declared an intention', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        capabilityRegistrator_app1: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_1},
        intentionRegistrator_app2: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_2},
        lookup_app2: {useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_2},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const capabilityRegistratorApp1PO = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegistrator_app1');
      const intentionRegistratorApp2PO = pagePOs.get<RegisterIntentionPagePO>('intentionRegistrator_app2');
      const lookupApp2PO = pagePOs.get<LookupCapabilityPagePO>('lookup_app2');

      // Register a public capability in 'app-1'
      const publicCapabilityApp1Id = await capabilityRegistratorApp1PO.registerCapability({type: 'type', qualifier: {key: 'value'}, private: false});

      // Register the intention in 'app-2' for that capability
      await intentionRegistratorApp2PO.registerIntention({type: 'type', qualifier: {key: 'value'}});

      // Lookup the capability from 'app-2'
      await lookupApp2PO.lookup();
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([publicCapabilityApp1Id]);

      await lookupApp2PO.lookup({appSymbolicName: 'app-1'});
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([publicCapabilityApp1Id]);
    });

    test('should not allow to look up private capabilities from other apps for which the requesting app has declared an intention', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        capabilityRegistrator_app1: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_1},
        intentionRegistrator_app2: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_2},
        lookup_app2: {useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_2},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const capabilityRegistratorApp1PO = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegistrator_app1');
      const intentionRegistratorApp2PO = pagePOs.get<RegisterIntentionPagePO>('intentionRegistrator_app2');
      const lookupApp2PO = pagePOs.get<LookupCapabilityPagePO>('lookup_app2');

      // Register a private capability in 'app-1'
      await capabilityRegistratorApp1PO.registerCapability({type: 'type', qualifier: {key: 'value'}, private: true});

      // Register the intention in 'app-2' for that capability
      await intentionRegistratorApp2PO.registerIntention({type: 'type', qualifier: {key: 'value'}});

      // Lookup the capability from 'app-2'
      await lookupApp2PO.lookup();
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([]);
    });

    test('should not allow to look up public capabilities from other apps for which the requesting app has not declared an intention', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        capabilityRegistrator_app1: {useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_1},
        lookup_app2: {useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_2},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const capabilityRegistratorApp1PO = pagePOs.get<RegisterCapabilityPagePO>('capabilityRegistrator_app1');
      const lookupApp2PO = pagePOs.get<LookupCapabilityPagePO>('lookup_app2');

      // Register a public capability in 'app-1'
      await capabilityRegistratorApp1PO.registerCapability({type: 'type', qualifier: {key: 'value'}, private: false});

      // Lookup the capability from 'app-2'
      await lookupApp2PO.lookup();
      await expect.poll(() => lookupApp2PO.getLookedUpCapabilityIds()).toEqual([]);
    });

    test('should allow observing capabilities', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterCapabilityPagePO,
        lookup: LookupCapabilityPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupCapabilityPagePO>('lookup');
      await lookupPO.lookup(); // do a single lookup

      // Register a capability
      const capability1Id = await registratorPO.registerCapability({type: 'type1', qualifier: {key: 'a'}, private: true});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability1Id]);

      // Register a capability
      const capability2Id = await registratorPO.registerCapability({type: 'type2', qualifier: {key: 'b'}, private: true});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id]);

      // Register a capability
      const capability3Id = await registratorPO.registerCapability({type: 'type3', qualifier: {key: 'c'}, private: true});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id, capability3Id]);

      // Unregister a capability3Id
      await registratorPO.unregisterCapability({id: capability3Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqualIgnoreOrder([capability1Id, capability2Id]);

      // Unregister a capability2Id
      await registratorPO.unregisterCapability({id: capability2Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([capability1Id]);

      // Unregister a capability1Id
      await registratorPO.unregisterCapability({id: capability1Id});
      await expect.poll(() => lookupPO.getLookedUpCapabilityIds()).toEqual([]);
    });
  });

  test.describe('Register intentions', () => {

    test('should allow to register an intention if the API to manage intentions is enabled for the requesting application', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3},
        lookup: {useClass: LookupIntentionPagePO, origin: TestingAppOrigins.APP_3},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});

      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register the intention
      const intentionId = await registratorPO.registerIntention({type: 'type', qualifier: {key: 'value'}});

      // Verify registration
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intentionId]);
    });

    test('should not allow to register an intention if the API to manage intentions is disabled for the requesting application', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_4},
      }, {queryParams: new Map().set('intentionRegisterApiDisabled', 'app-4').set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');

      // Try to register the intention
      await expect(registratorPO.registerIntention({type: 'type', qualifier: {key: 'value'}})).rejects.toThrow(/IntentionRegisterError/);
    });
  });

  test.describe('Unregister intentions', () => {

    test('should not allow to unregister an intention if the API to manage intentions is disabled for the requesting application', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_4},
      }, {queryParams: new Map().set('intentionRegisterApiDisabled', 'app-4').set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');

      // Try to unregister an intention
      await expect(registratorPO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}})).rejects.toThrow(/IntentionRegisterError/);
    });

    test('should allow to unregister an intention by id', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type', qualifier: {key: 'value1'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type', qualifier: {key: 'value2'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id]);

      // Unregister intention1Id
      await registratorPO.unregisterIntentions({id: intention1Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention2Id]);

      // Unregister intention2Id
      await registratorPO.unregisterIntentions({id: intention2Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should allow to unregister an intention by type', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'value1'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'value2'}});
      const intention3Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'value1'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'value2'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id]);

      // Unregister by 'type1'
      await registratorPO.unregisterIntentions({type: 'type1'});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention3Id, intention4Id]);

      // Unregister by 'type2'
      await registratorPO.unregisterIntentions({type: 'type2'});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should allow to unregister an intention by qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: undefined});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'a'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type4', qualifier: {key: 'b'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type5', qualifier: {key: 'c'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type6', qualifier: {key: 'c'}});
      const intention7Id = await registratorPO.registerIntention({type: 'type7', qualifier: {key: 'd'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id]);

      // Unregister by qualifier {}
      await registratorPO.unregisterIntentions({qualifier: {}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention3Id, intention4Id, intention5Id, intention6Id, intention7Id]);

      // Unregister by qualifier {key: 'a'}
      await registratorPO.unregisterIntentions({qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention4Id, intention5Id, intention6Id, intention7Id]);

      // Unregister by qualifier {key: 'b'}
      await registratorPO.unregisterIntentions({qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention5Id, intention6Id, intention7Id]);

      // Unregister by qualifier {key: 'c'}
      await registratorPO.unregisterIntentions({qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention7Id]);

      // Unregister by qualifier {key: 'd'}
      await registratorPO.unregisterIntentions({qualifier: {key: 'd'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should allow to unregister an intention by type and qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'b'}});
      const intention3Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'a'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'a'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'b'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id]);

      // Unregister by type 'type1' and qualifier {key: 'a'}
      await registratorPO.unregisterIntentions({type: 'type1', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention2Id, intention3Id, intention4Id, intention5Id, intention6Id]);

      // Unregister by type 'type1' and qualifier {key: 'b'}
      await registratorPO.unregisterIntentions({type: 'type1', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention3Id, intention4Id, intention5Id, intention6Id]);

      // Unregister by type 'type2' and qualifier {key: 'a'}
      await registratorPO.unregisterIntentions({type: 'type2', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention4Id, intention5Id, intention6Id]);

      // Unregister by type 'type2' and qualifier {key: 'b'}
      await registratorPO.unregisterIntentions({type: 'type2', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention5Id, intention6Id]);

      // Unregister by type 'type3' and qualifier {key: 'a'}
      await registratorPO.unregisterIntentions({type: 'type3', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention6Id]);

      // Unregister by type 'type3' and qualifier {key: 'b'}
      await registratorPO.unregisterIntentions({type: 'type3', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should allow to unregister intentions by qualifier containing wildcard (*) value', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: undefined});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'a'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type4', qualifier: {key: 'b'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type5', qualifier: {key: 'c'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type6', qualifier: {key: '*'}});
      const intention7Id = await registratorPO.registerIntention({type: 'type7', qualifier: {otherKey: 'a'}});
      const intention8Id = await registratorPO.registerIntention({type: 'type8', qualifier: {'*': '*'}});
      const intention9Id = await registratorPO.registerIntention({type: 'type9', qualifier: {'*': '*', 'key': '*'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id, intention8Id, intention9Id]);

      // Unregister by qualifier {key: '*'}
      await registratorPO.unregisterIntentions({qualifier: {key: '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id, intention2Id, intention7Id, intention8Id, intention9Id]);
    });

    test('should allow to unregister intentions by `AnyQualifier`', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: undefined});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'a'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type4', qualifier: {key: 'b'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type5', qualifier: {key: 'c'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type6', qualifier: {key: '*'}});
      const intention7Id = await registratorPO.registerIntention({type: 'type7', qualifier: {otherKey: 'a'}});
      const intention8Id = await registratorPO.registerIntention({type: 'type8', qualifier: {'*': '*'}});
      const intention9Id = await registratorPO.registerIntention({type: 'type9', qualifier: {'*': '*', 'key': '*'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id, intention8Id, intention9Id]);

      // Unregister by qualifier {'*': '*'}
      await registratorPO.unregisterIntentions({qualifier: {'*': '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should not allow to unregister intentions if qualifier key is missing in filter', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: undefined});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'a', otherKey: 'z'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type4', qualifier: {key: 'b', otherKey: '*'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type5', qualifier: {key: '*', otherKey: '*'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type6', qualifier: {'*': '*'}});
      const intention7Id = await registratorPO.registerIntention({type: 'type7', qualifier: {'*': '*', 'key': '*'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id]);

      // Unregister by qualifier {key: '*'}
      await registratorPO.unregisterIntentions({qualifier: {key: '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id]);

      // Unregister by qualifier {'*': '*'}
      await registratorPO.unregisterIntentions({qualifier: {'*': '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should not allow to unregister intentions if filter contains additional qualifier key', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: undefined});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'a'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type4', qualifier: {key: 'b'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type5', qualifier: {key: 'c'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type6', qualifier: {key: '*'}});
      const intention7Id = await registratorPO.registerIntention({type: 'type7', qualifier: {'*': '*'}});
      const intention8Id = await registratorPO.registerIntention({type: 'type8', qualifier: {'*': '*', 'key': '*'}});
      await lookupPO.lookup();
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id, intention8Id]);

      // Unregister by qualifier {key: '*', otherKey: '*'}
      await registratorPO.unregisterIntentions({qualifier: {key: '*', otherKey: '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id, intention2Id, intention3Id, intention4Id, intention5Id, intention6Id, intention7Id, intention8Id]);

      // Unregister by qualifier {'*': '*', 'key': '*'}
      await registratorPO.unregisterIntentions({qualifier: {'*': '*', 'key': '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id, intention2Id, intention7Id]);

      // Unregister by qualifier {'*': '*'}
      await registratorPO.unregisterIntentions({qualifier: {'*': '*'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });

    test('should not allow to unregister intentions from other applications', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator_app2: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_2},
        registrator_app3: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3},
        lookup_app2: {useClass: LookupIntentionPagePO, origin: TestingAppOrigins.APP_2},
        lookup_app3: {useClass: LookupIntentionPagePO, origin: TestingAppOrigins.APP_3},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorApp2PO = pagePOs.get<RegisterIntentionPagePO>('registrator_app2');
      const registratorApp3PO = pagePOs.get<RegisterIntentionPagePO>('registrator_app3');
      const lookupApp2PO = pagePOs.get<LookupIntentionPagePO>('lookup_app2');

      // Register intentions
      const intentionApp2Id = await registratorApp2PO.registerIntention({type: 'type', qualifier: {key: 'value'}});
      const intentionApp3Id = await registratorApp3PO.registerIntention({type: 'type', qualifier: {key: 'value'}});

      await lookupApp2PO.lookup();
      await expect.poll(() => lookupApp2PO.getLookedUpIntentionIds()).toEqual([intentionApp2Id, intentionApp3Id]);

      // Unregister the intention in 'app-2'
      await registratorApp2PO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}});
      await registratorApp2PO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-2'});
      await registratorApp2PO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-3'});
      await expect.poll(() => lookupApp2PO.getLookedUpIntentionIds()).toEqual([intentionApp3Id]);

      // Unregister the intention in 'app-3'
      await registratorApp3PO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}});
      await registratorApp3PO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-2'});
      await registratorApp3PO.unregisterIntentions({type: 'type', qualifier: {key: 'value'}, appSymbolicName: 'app-3'});
      await expect.poll(() => lookupApp2PO.getLookedUpIntentionIds()).toEqual([]);
    });
  });

  test.describe('Lookup intentions', () => {

    test('should allow to look up intentions of the requesting application', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator_app1: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1},
        registrator_app2: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3},
        lookup_app1: {useClass: LookupIntentionPagePO, origin: TestingAppOrigins.APP_1},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorApp1PO = pagePOs.get<RegisterIntentionPagePO>('registrator_app1');
      const registratorApp2PO = pagePOs.get<RegisterIntentionPagePO>('registrator_app2');
      const lookupApp1PO = pagePOs.get<LookupIntentionPagePO>('lookup_app1');

      // Register intentions in 'app-1'
      const intention1Id = await registratorApp1PO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      const intention2Id = await registratorApp1PO.registerIntention({type: 'type1', qualifier: {key: 'b'}});
      const intention3Id = await registratorApp1PO.registerIntention({type: 'type1', qualifier: {key: 'c'}});

      // Register intentions in 'app-2'
      await registratorApp2PO.registerIntention({type: 'type2', qualifier: {key: 'a'}});
      await registratorApp2PO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      await registratorApp2PO.registerIntention({type: 'type2', qualifier: {key: 'c'}});

      // Verify the lookup when setting the app explicitly via filter
      await lookupApp1PO.lookup({appSymbolicName: 'app-1'});
      await expect.poll(() => lookupApp1PO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id]);
    });

    test('should allow to look up intentions by id', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'c'}});

      // Lookup intention 1
      await lookupPO.lookup({id: intention1Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id]);

      // Lookup intention 2
      await lookupPO.lookup({id: intention2Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention2Id]);

      // Lookup intention 3
      await lookupPO.lookup({id: intention3Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention3Id]);
    });

    test('should allow to look up intentions by type', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'c'}});

      // Lookup intention 1
      await lookupPO.lookup({type: 'type1'});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id]);

      // Lookup intention 2
      await lookupPO.lookup({type: 'type2'});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention2Id]);

      // Lookup intention 3
      await lookupPO.lookup({type: 'type3'});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention3Id]);
    });

    test('should allow to look up intentions by qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'c'}});

      // Lookup intention 1
      await lookupPO.lookup({qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id]);

      // Lookup intention 2
      await lookupPO.lookup({qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention2Id]);

      // Lookup intention 3
      await lookupPO.lookup({qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention3Id]);
    });

    test('should allow to look up intentions by type and qualifier', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');

      // Register intentions
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'c'}});
      const intention4Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'd'}});
      const intention5Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'e'}});
      const intention6Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'f'}});

      // Lookup intention 1
      await lookupPO.lookup({type: 'type1', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id]);

      // Lookup intention 2
      await lookupPO.lookup({type: 'type2', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention2Id]);

      // Lookup intention 3
      await lookupPO.lookup({type: 'type3', qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention3Id]);

      // Lookup intention 4
      await lookupPO.lookup({type: 'type1', qualifier: {key: 'd'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention4Id]);

      // Lookup intention 5
      await lookupPO.lookup({type: 'type2', qualifier: {key: 'e'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention5Id]);

      // Lookup intention 6
      await lookupPO.lookup({type: 'type3', qualifier: {key: 'f'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention6Id]);
    });

    test('should allow to look up intentions from other apps', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator_app1: {useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1},
        lookup_app2: {useClass: LookupIntentionPagePO, origin: TestingAppOrigins.APP_2},
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorApp1PO = pagePOs.get<RegisterIntentionPagePO>('registrator_app1');
      const lookupApp2PO = pagePOs.get<LookupIntentionPagePO>('lookup_app2');

      // Register an intention in 'app-1'
      const intentionApp1Id = await registratorApp1PO.registerIntention({type: 'type', qualifier: {key: 'value'}});

      // Lookup the intention from 'app-2'
      await lookupApp2PO.lookup();
      await expect.poll(() => lookupApp2PO.getLookedUpIntentionIds()).toEqual([intentionApp1Id]);

      await lookupApp2PO.lookup({appSymbolicName: 'app-1'});
      await expect.poll(() => lookupApp2PO.getLookedUpIntentionIds()).toEqual([intentionApp1Id]);
    });

    test('should allow observing intentions', async ({testingAppPO}) => {
      const pagePOs = await testingAppPO.navigateTo({
        registrator: RegisterIntentionPagePO,
        lookup: LookupIntentionPagePO,
      }, {queryParams: new Map().set('activatorApiDisabled', true)});
      const registratorPO = pagePOs.get<RegisterIntentionPagePO>('registrator');
      const lookupPO = pagePOs.get<LookupIntentionPagePO>('lookup');
      await lookupPO.lookup(); // do a single lookup

      // Register a intention
      const intention1Id = await registratorPO.registerIntention({type: 'type1', qualifier: {key: 'a'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id]);

      // Register a intention
      const intention2Id = await registratorPO.registerIntention({type: 'type2', qualifier: {key: 'b'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id]);

      // Register a intention
      const intention3Id = await registratorPO.registerIntention({type: 'type3', qualifier: {key: 'c'}});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id, intention3Id]);

      // Unregister a intention3Id
      await registratorPO.unregisterIntentions({id: intention3Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqualIgnoreOrder([intention1Id, intention2Id]);

      // Unregister a intention2Id
      await registratorPO.unregisterIntentions({id: intention2Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([intention1Id]);

      // Unregister a intention1Id
      await registratorPO.unregisterIntentions({id: intention1Id});
      await expect.poll(() => lookupPO.getLookedUpIntentionIds()).toEqual([]);
    });
  });
});
