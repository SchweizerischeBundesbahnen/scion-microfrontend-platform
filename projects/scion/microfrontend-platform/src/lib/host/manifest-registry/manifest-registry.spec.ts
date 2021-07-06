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
import { expectEmissions, installLoggerSpies, readConsoleLog, serveManifest } from '../../spec.util.spec';
import { ApplicationConfig } from '../platform-config';
import { Beans } from '@scion/toolkit/bean-manager';
import { ManifestRegistry } from './manifest-registry';
import { Capability } from '../../platform.model';
import { ManifestService } from '../../client/manifest-registry/manifest-service';
import { ObserveCaptor } from '@scion/toolkit/testing';
import CallInfo = jasmine.CallInfo;

const capabilityIdExtractFn = (capability: Capability): string => capability.metadata.id;

describe('ManifestRegistry', () => {

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
    installLoggerSpies();
  });
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

  describe('Capability Params', () => {
    it('should register params and support legacy param declaration (via manifest)', async () => {
      // Register capability via manifest
      const registeredApps: ApplicationConfig[] = [
        {
          symbolicName: 'host-app',
          manifestUrl: serveManifest({
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: true},
                  {name: 'param2', required: false},
                ],
                requiredParams: ['param3'], // deprecated; expect legacy support
                optionalParams: ['param4'], // deprecated; expect legacy support
              },
            ],
          }),
        },
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Assert deprecation warning
      expect(readConsoleLog('warn')).toEqual(jasmine.arrayContaining([
        `[DEPRECATION WARNING] The 'host-app' application uses a deprecated API for declaring required parameters of a capability. The API will be removed in a future release. To migrate, declare parameters by using the 'Capability#params' property, as follows: { params: [{name: 'param3', required: true}] }`,
        `[DEPRECATION WARNING] The 'host-app' application uses a deprecated API for declaring optional parameters of a capability. The API will be removed in a future release. To migrate, declare parameters by using the 'Capability#params' property, as follows: { params: [{name: 'param4', required: false}] }`,
      ]));

      // Assert registration
      const captor = new ObserveCaptor();
      Beans.get(ManifestService).lookupCapabilities$({type: 'capability'}).subscribe(captor);
      await expectEmissions(captor).toEqual([[jasmine.objectContaining<Capability>({
        type: 'capability',
        params: jasmine.arrayWithExactContents([
          {name: 'param1', required: true},
          {name: 'param2', required: false},
          {name: 'param3', required: true},
          {name: 'param4', required: false},
        ]),
        optionalParams: undefined,
        requiredParams: undefined,
      })]]);
    });

    it('should register params and support legacy param declaration (via ManifestService)', async () => {
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability via ManifestServie
      const capabilityId = await Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [
          {name: 'param1', required: true},
          {name: 'param2', required: false},
        ],
        requiredParams: ['param3'], // deprecated; expect legacy support
        optionalParams: ['param4'], // deprecated; expect legacy support
      });

      // Assert deprecation warning
      expect(readConsoleLog('warn')).toEqual(jasmine.arrayContaining([
        `[DEPRECATION WARNING] The 'host-app' application uses a deprecated API for declaring required parameters of a capability. The API will be removed in a future release. To migrate, declare parameters by using the 'Capability#params' property, as follows: { params: [{name: 'param3', required: true}] }`,
        `[DEPRECATION WARNING] The 'host-app' application uses a deprecated API for declaring optional parameters of a capability. The API will be removed in a future release. To migrate, declare parameters by using the 'Capability#params' property, as follows: { params: [{name: 'param4', required: false}] }`,
      ]));

      // Assert registration
      const captor = new ObserveCaptor();
      Beans.get(ManifestService).lookupCapabilities$({id: capabilityId}).subscribe(captor);
      await expectEmissions(captor).toEqual([[jasmine.objectContaining<Capability>({
        type: 'capability',
        params: jasmine.arrayWithExactContents([
          {name: 'param1', required: true},
          {name: 'param2', required: false},
          {name: 'param3', required: true},
          {name: 'param4', required: false},
        ]),
        optionalParams: undefined,
        requiredParams: undefined,
      })]]);
    });

    it('should error if params forget to declare whether they are required or optional (via manifest)', async () => {
      // Register capability via manifest
      const registeredApps: ApplicationConfig[] = [
        {
          symbolicName: 'host-app',
          manifestUrl: serveManifest({
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param', required: undefined},
                ],
              },
            ],
          }),
        },
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});
      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] Parameter 'param' must be explicitly defined as required or optional.`,
      ]));
    });

    it('should error if params forget to declare whether they are required or optional (via ManifestService)', async () => {
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability via ManifestServie
      await expectAsync(Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [{name: 'param', required: undefined}],
      })).toBeRejectedWithError(`[CapabilityParamError] Parameter 'param' must be explicitly defined as required or optional.`);
      expect(readConsoleLog('error', {filter: /CapabilityParamError/})).toEqual([]);
    });

    it('should error if deprecated params are required (via manifest)', async () => {
      // Register capability via manifest
      const registeredApps: ApplicationConfig[] = [
        {
          symbolicName: 'host-app',
          manifestUrl: serveManifest({
            name: 'Host',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: true, deprecated: true},
                ],
              },
            ],
          }),
        },
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});
      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`,
      ]));
    });

    it('should error if deprecated params, which declare a substitute, are required (via manifest)', async () => {
      // Register capability via manifest
      const registeredApps: ApplicationConfig[] = [
        {
          symbolicName: 'host-app',
          manifestUrl: serveManifest({
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
          }),
        },
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});
      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`,
      ]));
    });

    it('should error if deprecated params are required (via ManifestService)', async () => {
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register capability via ManifestServie
      await expectAsync(Beans.get(ManifestService).registerCapability({
        type: 'capability',
        params: [{name: 'param1', required: true, deprecated: true}],
      })).toBeRejectedWithError(`[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='param1']`);
      expect(readConsoleLog('error', {filter: /CapabilityParamError/})).toEqual([]);
    });

    it('should error if deprecated params, which declare a substitute, are required (via ManifestService)', async () => {
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
      const registeredApps: ApplicationConfig[] = [
        {
          symbolicName: 'host-app',
          manifestUrl: serveManifest({
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
          }),
        },
      ];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});
      expect(readConsoleLog('error', {filter: /CapabilityParamError/, projectFn: (call: CallInfo<any>) => (call.args[1] as Error)?.message})).toEqual(jasmine.arrayContaining([
        `[CapabilityParamError] The deprecated parameter 'param1' defines an invalid substitute 'paramX'. Valid substitutes are: [param2,param3]`,
      ]));
    });

    it('should error if deprecated params declare an invalid substitute (via ManifestService)', async () => {
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: serveManifest({name: 'Host'})}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
});
