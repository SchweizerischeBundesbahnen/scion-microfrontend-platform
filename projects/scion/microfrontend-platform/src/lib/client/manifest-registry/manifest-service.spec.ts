/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {MicrofrontendPlatformHost} from '../../host/microfrontend-platform-host';
import {expectEmissions} from '../../testing/spec.util.spec';
import {Beans} from '@scion/toolkit/bean-manager';
import {ManifestService} from '../../client/manifest-registry/manifest-service';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {Capability, Intention} from '../../platform.model';
import {ManifestRegistry} from '../../host/manifest-registry/manifest-registry';
import {ManifestFixture} from '../../testing/manifest-fixture/manifest-fixture';

const manifestObjectIdsExtractFn = (manifestObjects: Array<Capability | Intention>): string[] => manifestObjects.map(manifestObject => manifestObject.metadata.id);

describe('ManifestService', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  describe('#lookupCapabilities$', () => {

    it('should allow looking up own capabilities without declaring an intention (implicit intention)', async () => {
      await MicrofrontendPlatformHost.start({host: {symbolicName: 'host-app'}, applications: []});

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup using no qualifier filter
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: undefined
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: undefined}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: {'*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {'*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: {}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: null
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: null}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'edit'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability]]);

      // Lookup using qualifier filter: {entity: 'person', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier3Capability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier2Capability]]);

      // Lookup using qualifier filter: {entity: 'person', '*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability]]);
    });

    it('should allow looking up public capabilities of another app (intention contains the any-more wildcard (**))', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intention in host-app: {entity: 'person', '*': '*'}
      Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', '*': '*'}}, 'host-app');

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-1');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'app-1');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}, private: false}, 'app-1');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', private: false}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup using no qualifier filter
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability]]);

      // Lookup using qualifier filter: undefined
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: undefined}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability]]);

      // Lookup using qualifier filter: {'*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {'*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability]]);

      // Lookup using qualifier filter: {}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: null
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: null}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', mode: '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'edit'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability]]);

      // Lookup using qualifier filter: {entity: 'person', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier3Capability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier2Capability]]);

      // Lookup using qualifier filter: {entity: 'person', '*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability]]);
    });

    it('should allow looking up public capabilities of another app (only any-more wildcard (**) intention)', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intention in host-app: {'*': '*'}
      Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-1');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'app-1');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}, private: false}, 'app-1');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}, private: false}, 'app-1');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}, private: false}, 'app-1');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null, private: false}, 'app-1');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined, private: false}, 'app-1');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', private: false}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup using no qualifier filter
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: undefined
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: undefined}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: {'*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {'*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: {}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: null
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: null}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'edit'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability]]);

      // Lookup using qualifier filter: {entity: 'person', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier3Capability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier2Capability]]);

      // Lookup using qualifier filter: {entity: 'person', '*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability]]);
    });

    it('should allow looking up public capabilities of another app (intention contains the asterisk wildcard (*))', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intention in host-app: {entity: 'person', mode: '*'}
      Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-1');

      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', private: false}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup using no qualifier filter
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: undefined
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: undefined}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {'*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {'*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: null
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: null}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', mode: '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'edit'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', '*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);
    });

    it('should allow looking up public capabilities of another app (intention is an exact qualifier)', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intention in host-app: {entity: 'person', mode: 'new'}
      Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-1');

      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined, private: false}, 'app-1');
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', private: false}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup using no qualifier filter
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: undefined
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: undefined}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {'*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {'*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: null
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: null}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', mode: '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'edit'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new', other: 'property'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person', '*': '*'}
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability]]);
    });

    it('should not allow looking up private capabilities of another app', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intention in host-app: {'*': '*'}
      Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      // Register capability
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup all capabilities
      Beans.get(ManifestService).lookupCapabilities$({}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);
    });

    it('should allow looking up private capabilities of another app if scope check is disabled', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', scopeCheckDisabled: true},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intention in host-app: {'*': '*'}
      Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      // Register capability
      const capabilityId = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup all capabilities
      Beans.get(ManifestService).lookupCapabilities$({}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[capabilityId]]);
    });

    it('should not allow looking up public capabilities of another app without matching intention', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register capability
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup all capabilities
      Beans.get(ManifestService).lookupCapabilities$({}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);
    });

    it('should allow looking up public capabilities of another app without matching intention if intention check is disabled', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionCheckDisabled: true},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register capability
      const capabilityId = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup all capabilities
      Beans.get(ManifestService).lookupCapabilities$({}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[capabilityId]]);
    });
  });

  describe('#lookupIntentions$', () => {
    it('should allow looking up intentions', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      // Register intentions in host-app
      const asteriskQualifierHostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierHostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');
      const qualifier1HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8HostIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');

      // Register intentions in app-1
      const asteriskQualifierAppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'app-1');
      const exactQualifierAppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1');
      const qualifier1AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1');
      const qualifier2AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'app-1');
      const qualifier3AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'app-1');
      const qualifier4AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1');
      const qualifier5AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'app-1');
      const qualifier6AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'app-1');
      const qualifier7AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'app-1');
      const qualifier8AppIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'app-1');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // Lookup using no qualifier filter
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        asteriskQualifierHostIntention, exactQualifierHostIntention, qualifier1HostIntention, qualifier2HostIntention, qualifier3HostIntention, qualifier4HostIntention, qualifier5HostIntention, qualifier6HostIntention, qualifier7HostIntention, qualifier8HostIntention,
        asteriskQualifierAppIntention, exactQualifierAppIntention, qualifier1AppIntention, qualifier2AppIntention, qualifier3AppIntention, qualifier4AppIntention, qualifier5AppIntention, qualifier6AppIntention, qualifier7AppIntention, qualifier8AppIntention,
      ]]);

      // Lookup using qualifier filter: undefined
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: undefined}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        asteriskQualifierHostIntention, exactQualifierHostIntention, qualifier1HostIntention, qualifier2HostIntention, qualifier3HostIntention, qualifier4HostIntention, qualifier5HostIntention, qualifier6HostIntention, qualifier7HostIntention, qualifier8HostIntention,
        asteriskQualifierAppIntention, exactQualifierAppIntention, qualifier1AppIntention, qualifier2AppIntention, qualifier3AppIntention, qualifier4AppIntention, qualifier5AppIntention, qualifier6AppIntention, qualifier7AppIntention, qualifier8AppIntention,
      ]]);

      // Lookup using qualifier filter: {'*': '*'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {'*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        asteriskQualifierHostIntention, exactQualifierHostIntention, qualifier1HostIntention, qualifier2HostIntention, qualifier3HostIntention, qualifier4HostIntention, qualifier5HostIntention, qualifier6HostIntention, qualifier7HostIntention, qualifier8HostIntention,
        asteriskQualifierAppIntention, exactQualifierAppIntention, qualifier1AppIntention, qualifier2AppIntention, qualifier3AppIntention, qualifier4AppIntention, qualifier5AppIntention, qualifier6AppIntention, qualifier7AppIntention, qualifier8AppIntention,
      ]]);

      // Lookup using qualifier filter: {}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        qualifier5HostIntention, qualifier6HostIntention, qualifier7HostIntention, qualifier8HostIntention,
        qualifier5AppIntention, qualifier6AppIntention, qualifier7AppIntention, qualifier8AppIntention,
      ]]);

      // Lookup using qualifier filter: null
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: null}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        qualifier5HostIntention, qualifier6HostIntention, qualifier7HostIntention, qualifier8HostIntention,
        qualifier5AppIntention, qualifier6AppIntention, qualifier7AppIntention, qualifier8AppIntention,
      ]]);

      // Lookup using qualifier filter: {entity: 'person', mode: '*'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        asteriskQualifierHostIntention, exactQualifierHostIntention,
        asteriskQualifierAppIntention, exactQualifierAppIntention,
      ]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        exactQualifierHostIntention,
        exactQualifierAppIntention,
      ]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'edit'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Lookup using qualifier filter: {entity: 'person'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        qualifier1HostIntention,
        qualifier1AppIntention,
      ]]);

      // Lookup using qualifier filter: {entity: 'person', other: 'property'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        qualifier4HostIntention,
        qualifier4AppIntention,
      ]]);

      // Lookup using qualifier filter: {entity: 'person', mode: 'new', other: 'property'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        qualifier3HostIntention,
        qualifier3AppIntention,
      ]]);

      // Lookup using qualifier filter: {entity: 'person', '*': '*'}
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[
        asteriskQualifierHostIntention, exactQualifierHostIntention, qualifier1HostIntention, qualifier2HostIntention, qualifier3HostIntention, qualifier4HostIntention,
        asteriskQualifierAppIntention, exactQualifierAppIntention, qualifier1AppIntention, qualifier2AppIntention, qualifier3AppIntention, qualifier4AppIntention,
      ]]);
    });
  });

  describe('#removeCapabilities$', () => {
    it('should allow removing capabilities using an exact qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all capabilities to be registered
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Remove capabilities using following qualifier: {entity: 'person', mode: 'new'}
      await Beans.get(ManifestService).unregisterCapabilities({type: 'view', qualifier: {entity: 'person', mode: 'new'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect capabilities
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);
    });

    it('should allow removing capabilities using the asterisk wildcard (*) in the qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all capabilities to be registered
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Remove capabilities using following qualifier: {entity: 'person', mode: '*'}
      await Beans.get(ManifestService).unregisterCapabilities({type: 'view', qualifier: {entity: 'person', mode: '*'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect capabilities
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);
    });

    it('should allow removing capabilities using an exact qualifier together with the any-more wildcard (**) ', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all capabilities to be registered
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Remove capabilities using following qualifier: {entity: 'person', mode: 'new', '*': '*'}
      await Beans.get(ManifestService).unregisterCapabilities({type: 'view', qualifier: {entity: 'person', mode: 'new', '*': '*'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: 'new', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect capabilities
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);
    });

    it('should allow removing capabilities using the asterisk wildcard (*) together with the any-more wildcard (**) ', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all capabilities to be registered
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Remove capabilities using following qualifier: {entity: 'person', mode: '*', '*': '*'}
      await Beans.get(ManifestService).unregisterCapabilities({type: 'view', qualifier: {entity: 'person', mode: '*', '*': '*'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupCapabilities$({type: 'view', qualifier: {entity: 'person', mode: '*', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect capabilities
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);
    });

    it('should allow removing all capabilities using the any-more wildcard (**)', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all capabilities to be registered
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Remove capabilities using following qualifier: {entity: '*': '*'}
      await Beans.get(ManifestService).unregisterCapabilities({type: 'view', qualifier: {'*': '*'}});

      // Expect capabilities
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);
    });

    it('should allow removing all capabilities by not specifying a qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capabilities
      const exactQualifierCapability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier3Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier4Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {}}, 'host-app');
      const qualifier5Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: null}, 'host-app');
      const qualifier6Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier7Capability = await Beans.get(ManifestRegistry).registerCapability({type: 'view'}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all capabilities to be registered
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[exactQualifierCapability, qualifier1Capability, qualifier2Capability, qualifier3Capability, qualifier4Capability, qualifier5Capability, qualifier6Capability, qualifier7Capability]]);

      // Remove capabilities using no qualifier
      await Beans.get(ManifestService).unregisterCapabilities({type: 'view'});

      // Expect capabilities
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);
    });

    it(`should not remove other application's capabilities`, async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionCheckDisabled: true},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      const capabilityIdHostApp = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'host-app');
      const capabilityIdApp1 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person'}, private: false}, 'app-1');

      // Unregister all capabilities of the host app.
      await Beans.get(ManifestService).unregisterCapabilities();

      // Expect only the capability in the host app to be removed.
      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      Beans.get(ManifestService).lookupCapabilities$({id: capabilityIdHostApp}).subscribe(captor);
      await expectEmissions(captor).toEqual([[]]);

      Beans.get(ManifestService).lookupCapabilities$({id: capabilityIdApp1}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[capabilityIdApp1]]);
    });
  });

  describe('#removeIntentions$', () => {
    it('should allow removing intentions using an exact qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionRegisterApiDisabled: false},
        applications: [],
      });

      // Register intentions
      const asteriskQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');
      const qualifier9Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all intentions to be registered
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, exactQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);

      // Remove intentions using following qualifier: {entity: 'person', mode: 'new'}
      await Beans.get(ManifestService).unregisterIntentions({type: 'view', qualifier: {entity: 'person', mode: 'new'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: 'new'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect intentions
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);
    });

    it('should allow removing intentions using the asterisk wildcard (*) in the qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionRegisterApiDisabled: false},
        applications: [],
      });

      // Register intentions
      const asteriskQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');
      const qualifier9Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all intentions to be registered
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, exactQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);

      // Remove intentions using following qualifier: {entity: 'person', mode: '*'}
      await Beans.get(ManifestService).unregisterIntentions({type: 'view', qualifier: {entity: 'person', mode: '*'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect intentions
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);
    });

    it('should allow removing intentions using an exact qualifier together with the any-more wildcard (**) ', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionRegisterApiDisabled: false},
        applications: [],
      });

      // Register intentions
      const asteriskQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');
      const qualifier9Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all intentions to be registered
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, exactQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);

      // Remove intentions using following qualifier: {entity: 'person', mode: 'new', '*': '*'}
      await Beans.get(ManifestService).unregisterIntentions({type: 'view', qualifier: {entity: 'person', mode: 'new', '*': '*'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: 'new', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect intentions
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);
    });

    it('should allow removing intentions using the asterisk wildcard (*) together with the any-more wildcard (**) ', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionRegisterApiDisabled: false},
        applications: [],
      });

      // Register intentions
      const asteriskQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');
      const qualifier9Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all intentions to be registered
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, exactQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);

      // Remove intentions using following qualifier: {entity: 'person', mode: '*', '*': '*'}
      await Beans.get(ManifestService).unregisterIntentions({type: 'view', qualifier: {entity: 'person', mode: '*', '*': '*'}});

      // Expect removal and lookup to be symmetrical, i.e., a subsequent lookup with the same qualifier as used for the removal should return nothing
      Beans.get(ManifestService).lookupIntentions$({type: 'view', qualifier: {entity: 'person', mode: '*', '*': '*'}}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);

      // Expect intentions
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[qualifier1Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);
    });

    it('should allow removing all intentions using the any-more wildcard (**)', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionRegisterApiDisabled: false},
        applications: [],
      });

      // Register intentions
      const asteriskQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');
      const qualifier9Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all intentions to be registered
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, exactQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);

      // Remove intentions using following qualifier: {'*': '*'}
      await Beans.get(ManifestService).unregisterIntentions({type: 'view', qualifier: {'*': '*'}});

      // Expect intentions
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);
    });

    it('should allow removing all intentions by not specifying a qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionRegisterApiDisabled: false},
        applications: [],
      });

      // Register intentions
      const asteriskQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const exactQualifierIntention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'host-app');

      const qualifier1Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person'}}, 'host-app');
      const qualifier2Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*', other: 'property'}}, 'host-app');
      const qualifier3Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'host-app');
      const qualifier4Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'host-app');
      const qualifier5Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {}}, 'host-app');
      const qualifier6Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: null}, 'host-app');
      const qualifier7Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: undefined}, 'host-app');
      const qualifier8Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view'}, 'host-app');
      const qualifier9Intention = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'*': '*'}}, 'host-app');

      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      // PRE-CONDITION: Verify all intentions to be registered
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[asteriskQualifierIntention, exactQualifierIntention, qualifier1Intention, qualifier2Intention, qualifier3Intention, qualifier4Intention, qualifier5Intention, qualifier6Intention, qualifier7Intention, qualifier8Intention, qualifier9Intention]]);

      // Remove intentions using no qualifier
      await Beans.get(ManifestService).unregisterIntentions({type: 'view'});

      // Expect intentions
      Beans.get(ManifestService).lookupIntentions$({type: 'view'}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[]]);
    });

    it(`should not remove other application's intentions`, async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app', intentionCheckDisabled: true, intentionRegisterApiDisabled: false},
        applications: [{symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()}],
      });

      const intentionIdHostApp = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app');
      const intentionIdApp1 = Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'app-1');

      // Unregister all intentions of the host app.
      await Beans.get(ManifestService).unregisterIntentions();

      // Expect only the intention in the host app to be removed.
      const captor = new ObserveCaptor(manifestObjectIdsExtractFn);

      Beans.get(ManifestService).lookupIntentions$({id: intentionIdHostApp}).subscribe(captor);
      await expectEmissions(captor).toEqual([[]]);

      Beans.get(ManifestService).lookupIntentions$({id: intentionIdApp1}).subscribe(captor.reset());
      await expectEmissions(captor).toEqual([[intentionIdApp1]]);
    });
  });
});
