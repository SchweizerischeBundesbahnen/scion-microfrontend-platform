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
import {MicrofrontendPlatformHost} from '../microfrontend-platform-host';
import {expectEmissions, installLoggerSpies, readConsoleLog} from '../../testing/spec.util.spec';
import {Beans} from '@scion/toolkit/bean-manager';
import {ManifestRegistry} from './manifest-registry';
import {Capability} from '../../platform.model';
import {ManifestService} from '../../client/manifest-registry/manifest-service';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {ManifestFixture} from '../../testing/manifest-fixture/manifest-fixture';
import {firstValueFrom} from 'rxjs';
import {CapabilityInterceptor} from './capability-interceptors';
import CallInfo = jasmine.CallInfo;

const capabilityIdExtractFn = (capability: Capability): string => capability.metadata!.id;

describe('ManifestRegistry', () => {

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
    installLoggerSpies();
  });
  afterEach(async () => await MicrofrontendPlatform.destroy());

  describe('hasIntention', () => {

    it('should error if not passing an exact qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      expect(() => Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app')).toThrowError(/IllegalQualifierError/);
    });

    it(`should have an implicit intention for a capability having the qualifier ({entity: 'person', mode: 'new'})`, async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [
          {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
          {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
        ],
      });

      // Register capability
      await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1');

      // Expect app-1 to have an implicit intention because providing the capability
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an exact qualifier ({entity: 'person', mode: 'new'})`, async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [
          {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
          {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
        ],
      });

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an asterisk wildcard qualifier ({entity: 'person', mode: '*'})`, async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [
          {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
          {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
        ],
      });

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an any-more wildcard (**) qualifier ({entity: 'person', '*': '*'})`, async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [
          {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
          {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
        ],
      });

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', '*': '*'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'company'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2')).toBeFalse();
    });
  });

  describe('resolveCapabilitiesByIntent', () => {

    it('should error if not passing an exact qualifier', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      expect(() => Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app')).toThrowError(/IllegalQualifierError/);
    });

    describe('implicit intention', () => {

      it(`should resolve to own private capability having the qualifier ({entity: 'person', mode: 'new'})`, async () => {
        await MicrofrontendPlatformHost.start({
          host: {symbolicName: 'host-app'},
          applications: [
            {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
            {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
          ],
        });

        // Register capability
        const capabilityId = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1');

        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}, 'app-1')).toEqual([]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toEqual([]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toEqual([]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'new', other: 'property'}}, 'app-1')).toEqual([]);

        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2')).toEqual([]);
      });

      it('should not resolve to private capabilities of other applications', async () => {
        await MicrofrontendPlatformHost.start({
          host: {symbolicName: 'host-app'},
          applications: [
            {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
            {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
          ],
        });

        // Register capabilities of app-1
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: true}, 'app-1');
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'edit'}, private: true}, 'app-1');
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'delete'}, private: true}, 'app-1');

        // Register capabilities of app-2 (public, private, implicit-private)
        const capabilityId1 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-2');
        const capabilityId2 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'edit'}, private: true}, 'app-2');
        const capabilityId3 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'delete'}}, 'app-2');

        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId1]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId2]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'delete'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId3]);
      });

      it('should not resolve to public capabilities of other applications', async () => {
        await MicrofrontendPlatformHost.start({
          host: {symbolicName: 'host-app'},
          applications: [
            {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
            {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
          ],
        });

        // Register capabilities of app-1
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-1');
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'edit'}, private: false}, 'app-1');
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'delete'}, private: false}, 'app-1');

        // Register capabilities of app-2 (public, private, implicit-private)
        const capabilityId1 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-2');
        const capabilityId2 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'edit'}, private: true}, 'app-2');
        const capabilityId3 = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'delete'}}, 'app-2');

        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId1]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'edit'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId2]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'delete'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId3]);
      });
    });

    describe('explicit intention', () => {

      it(`should resolve to public foreign capability having the qualifier ({entity: 'person', mode: 'new'})`, async () => {
        await MicrofrontendPlatformHost.start({
          host: {symbolicName: 'host-app'},
          applications: [
            {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
            {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
          ],
        });

        // Register capability of app-1
        const capabilityId = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}, private: false}, 'app-1');

        // Register intention of app-2
        Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2');

        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'new'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      });

      it('should resolve to public (but not private) capabilities of other apps', async () => {
        await MicrofrontendPlatformHost.start({
          host: {symbolicName: 'host-app'},
          applications: [
            {symbolicName: 'app-1', manifestUrl: new ManifestFixture({name: 'App 1'}).serve()},
            {symbolicName: 'app-2', manifestUrl: new ManifestFixture({name: 'App 2'}).serve()},
          ],
        });

        // Register capabilities of app-1
        const publicCapabilityId = await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'public'}, private: false}, 'app-1');
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'private'}, private: true}, 'app-1');
        await Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'implicit-private'}}, 'app-1');

        // Register intentions of app-2
        Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'public'}}, 'app-2');
        Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'private'}}, 'app-2');
        Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', mode: 'implicit-private'}}, 'app-2');

        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'public'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([publicCapabilityId]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'private'}}, 'app-2')).toEqual([]);
        expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', mode: 'implicit-private'}}, 'app-2')).toEqual([]);
      });
    });
  });

  it('should not allow registering a capability using the any-more wildcard (**) in its qualifier', async () => {
    await MicrofrontendPlatformHost.start({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    await expectAsync(Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', '*': '*'}}, 'host-app')).toBeRejectedWithError('[IllegalQualifierError] Qualifier must be exact, i.e., not contain wildcards. [qualifier=\'{"entity":"person","*":"*"}\']');
  });

  it('should not allow registering a capability using the asterisk wildcard (*) in its qualifier', async () => {
    await MicrofrontendPlatformHost.start({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    await expectAsync(Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', mode: '*'}}, 'host-app')).toBeRejectedWithError('[IllegalQualifierError] Qualifier must be exact, i.e., not contain wildcards. [qualifier=\'{"entity":"person","mode":"*"}\']');
  });

  describe('Capability Params', () => {
    it('should register params (via manifest)', async () => {
      // Register capability via manifest
      await MicrofrontendPlatformHost.start({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: true},
                  {name: 'param2', required: false},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      // Assert registration
      const captor = new ObserveCaptor();
      Beans.get(ManifestService).lookupCapabilities$({type: 'capability'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[jasmine.objectContaining<Capability>({
        type: 'capability',
        params: jasmine.arrayWithExactContents([
          {name: 'param1', required: true},
          {name: 'param2', required: false},
        ]),
      })]]);
    });

    it('should register params (via ManifestService)', async () => {
      await MicrofrontendPlatformHost.start({
        host: {symbolicName: 'host-app'},
        applications: [],
      });

      // Register capability via ManifestServie
      const capabilityId = await Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [
          {name: 'param1', required: true},
          {name: 'param2', required: false},
        ],
      });

      // Assert registration
      const captor = new ObserveCaptor();
      Beans.get(ManifestService).lookupCapabilities$({id: capabilityId}).subscribe(captor);
      await expectEmissions(captor).toEqual([[jasmine.objectContaining<Capability>({
        type: 'capability',
        params: jasmine.arrayWithExactContents([
          {name: 'param1', required: true},
          {name: 'param2', required: false},
        ]),
      })]]);
    });

    it('should error if params forget to declare whether they are required or optional (via manifest)', async () => {
      await MicrofrontendPlatformHost.start({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param', required: undefined!},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] Parameter 'param' must be explicitly defined as required or optional.`,
      ]));
    });

    it('should error if params forget to declare whether they are required or optional (via ManifestService)', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      // Register capability via ManifestServie
      await expectAsync(Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [{name: 'param', required: undefined!}],
      })).toBeRejectedWithError(`[CapabilityParamError] Parameter 'param' must be explicitly defined as required or optional.`);
      expect(readConsoleLog('error', {filter: /CapabilityParamError/})).toEqual([]);
    });

    it('should error if deprecated params are required (via manifest)', async () => {
      // Register capability via manifest
      await MicrofrontendPlatformHost.start({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: true, deprecated: true},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`,
      ]));
    });

    it('should error if deprecated params, which declare a substitute, are required (via manifest)', async () => {
      // Register capability via manifest
      await MicrofrontendPlatformHost.start({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: true, deprecated: {useInstead: 'param2'}},
                  {name: 'param2', required: true},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`,
      ]));
    });

    it('should error if deprecated params are required (via ManifestService)', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      // Register capability via ManifestServie
      await expectAsync(Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [{name: 'param1', required: true, deprecated: true}],
      })).toBeRejectedWithError(`[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`);
      expect(readConsoleLog('error', {filter: /CapabilityParamError/})).toEqual([]);
    });

    it('should error if deprecated params, which declare a substitute, are required (via ManifestService)', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      // Register capability via ManifestServie
      await expectAsync(Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [
          {name: 'param1', required: true, deprecated: {useInstead: 'param2'}},
          {name: 'param2', required: true},
        ],
      })).toBeRejectedWithError(`[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`);
      expect(readConsoleLog('error', {filter: /CapabilityParamError/})).toEqual([]);
    });

    it('should error if deprecated params declare an invalid substitute (via manifest)', async () => {
      // Register capability via manifest
      await MicrofrontendPlatformHost.start({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: false, deprecated: {useInstead: 'paramX'}},
                  {name: 'param2', required: true},
                  {name: 'param3', required: false},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] The deprecated parameter 'param1' defines an invalid substitute 'paramX'. Valid substitutes are: [param2,param3]`,
      ]));
    });

    it('should error if deprecated params declare an invalid substitute (via ManifestService)', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      // Register capability via ManifestServie
      await expectAsync(Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [
          {name: 'param1', required: false, deprecated: {useInstead: 'paramX'}},
          {name: 'param2', required: true},
          {name: 'param3', required: false},
        ],
      })).toBeRejectedWithError(`[CapabilityParamError] The deprecated parameter 'param1' defines an invalid substitute 'paramX'. Valid substitutes are: [param2,param3]`);
      expect(readConsoleLog('error', {filter: /CapabilityParamError/})).toEqual([]);
    });
  });

  it('should allow intercepting capabilities', async () => {
    await MicrofrontendPlatformHost.start({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    // Register a capability interceptor.
    Beans.register(CapabilityInterceptor, {
      useValue: new class implements CapabilityInterceptor {
        public async intercept(capability: Capability): Promise<Capability> {
          return {
            ...capability,
            metadata: {...capability.metadata!, id: '1'},
          };
        }
      },
    });

    // Register a capability.
    await Beans.get(ManifestRegistry).registerCapability({type: 'testee'}, 'host-app');

    // Expect the capability to be intercepted before its registration.
    const actual = (await firstValueFrom(Beans.get(ManifestService).lookupCapabilities$({type: 'testee'})))[0]!;
    expect(actual.metadata!.id).toEqual('1');
  });

  it('should use a unique identifier for capability ID', async () => {
    await MicrofrontendPlatformHost.start({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    const id1 = await Beans.get(ManifestRegistry).registerCapability({type: 'testee'}, 'host-app');
    const id2 = await Beans.get(ManifestRegistry).registerCapability({type: 'testee'}, 'host-app');
    expect(id1).not.toEqual(id2);
  });

  it('should use a unique identifier for intention ID', async () => {
    await MicrofrontendPlatformHost.start({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    const id1 = Beans.get(ManifestRegistry).registerIntention({type: 'testee'}, 'host-app');
    const id2 = Beans.get(ManifestRegistry).registerIntention({type: 'testee'}, 'host-app');
    expect(id1).not.toEqual(id2);
  });
});
