/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { MicrofrontendPlatform } from '../../microfrontend-platform';
import { serveManifest } from '../../spec.util.spec';
import { ApplicationConfig } from '../platform-config';
import { Beans } from '@scion/toolkit/bean-manager';
import { ManifestRegistry } from './manifest-registry';
import { Capability } from '../../platform.model';

const capabilityIdExtractFn = (capability: Capability): string => capability.metadata.id;

describe('ManifestRegistry', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  describe('hasIntention', () => {

    it('should error if not passing an exact qualifier', async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      expect(() => Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '*'}}, 'host-app')).toThrowError(/IllegalQualifierError/);
    });

    it(`should have an implicit intention for a capability having an exact qualifier ({entity: 'person', id: '5'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1');

      // Expect app-1 to have an implicit intention because providing the capability
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '999'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });

    it(`should have an implicit intention for a capability having an asterisk wildcard qualifier ({entity: 'person', id: '*'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: '*'}}, 'app-1');

      // Expect app-1 to have an implicit intention because providing the capability
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });

    it(`should have an implicit intention for a capability having an optional qualifier ({entity: 'person', id: '?'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: '?'}}, 'app-1');

      // Expect app-1 to have an implicit intention because providing the capability
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an exact qualifier ({entity: 'person', id: '5'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '999'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an asterisk wildcard qualifier ({entity: 'person', id: '*'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', id: '*'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an any-more wildcard (**) qualifier ({entity: 'person', '*': '*'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {'entity': 'person', '*': '*'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'company'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });

    it(`should match an intention having an optional wildcard (?) qualifier ({entity: 'person', id: '?'})`, async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register intention
      await Beans.get(ManifestRegistry).registerIntention({type: 'view', qualifier: {entity: 'person', id: '?'}}, 'app-1');

      // Expect app-1 to have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1')).toBeTrue();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toBeTrue();

      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toBeFalse();
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toBeFalse();

      // Expect app-2 to not have an intention
      expect(Beans.get(ManifestRegistry).hasIntention({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toBeFalse();
    });
  });

  describe('resolveCapabilitiesByIntent', () => {

    it('should error if not passing an exact qualifier', async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      expect(() => Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '*'}}, 'host-app')).toThrowError(/IllegalQualifierError/);
    });

    it('should resolve to a capability having an exact qualifier', async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      const capabilityId = Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1');

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '999'}}, 'app-1')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toEqual([]);

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toEqual([]);
    });

    it('should resolve to a capability having an asterisk wildcard (*) in the qualifier', async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      const capabilityId = Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: '*'}}, 'app-1');

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '999'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person'}}, 'app-1')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toEqual([]);

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toEqual([]);
    });

    it('should resolve to a capability having an optional wildcard (?) in the qualifier', async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      const capabilityId = Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: '?'}}, 'app-1');

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '999'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person'}}, 'app-1').map(capabilityIdExtractFn)).toEqual([capabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', other: 'property'}}, 'app-1')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5', other: 'property'}}, 'app-1')).toEqual([]);

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: '5'}}, 'app-2')).toEqual([]);
    });

    it('should resolve to public (and not private) capabilities of other apps', async () => {
      const registeredApps: ApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
        {symbolicName: 'app-1', manifestUrl: serveManifest({name: 'App 1'})},
        {symbolicName: 'app-2', manifestUrl: serveManifest({name: 'App 2'})},
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability
      const publicCapabilityId = Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: 'public'}, private: false}, 'app-1');
      Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: 'private'}, private: true}, 'app-1');
      Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {entity: 'person', id: 'implicit-private'}}, 'app-1');

      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: 'public'}}, 'app-2').map(capabilityIdExtractFn)).toEqual([publicCapabilityId]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: 'private'}}, 'app-2')).toEqual([]);
      expect(Beans.get(ManifestRegistry).resolveCapabilitiesByIntent({type: 'view', qualifier: {entity: 'person', id: 'implicit-private'}}, 'app-2')).toEqual([]);
    });
  });

  it('should not allow registering a capability using the any-more wildcard (**) in its qualifier', async () => {
    const registeredApps: ApplicationConfig[] = [
      {symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})},
    ];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    expect(() => Beans.get(ManifestRegistry).registerCapability({type: 'view', qualifier: {'entity': 'person', '*': '*'}}, 'host-app')).toThrowError(`[CapabilityRegisterError] Asterisk wildcard ('*') not allowed in the qualifier key.`);
  });
});
