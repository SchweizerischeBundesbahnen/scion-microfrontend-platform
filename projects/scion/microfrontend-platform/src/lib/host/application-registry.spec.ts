/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ApplicationRegistry} from './application-registry';
import {MicrofrontendPlatform} from '../microfrontend-platform';
import {ManifestRegistry} from './manifest-registry/manifest-registry';
import {ɵMessageClient} from '../client/messaging/ɵmessage-client';
import {ɵManifestRegistry} from './manifest-registry/ɵmanifest-registry';
import {BrokerGateway, NullBrokerGateway} from '../client/messaging/broker-gateway';
import {Beans} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';
import {MessageClient} from '../client/messaging/message-client';

describe('ApplicationRegistry', () => {

  let registry: ApplicationRegistry;

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
    await MicrofrontendPlatform.startPlatform(async () => {
      Beans.register(MicrofrontendPlatformConfig);
      Beans.register(ApplicationRegistry);
      Beans.register(ManifestRegistry, {useClass: ɵManifestRegistry, eager: true});
      Beans.register(BrokerGateway, {useClass: NullBrokerGateway});
      Beans.register(MessageClient, {useClass: ɵMessageClient});
    });
    registry = Beans.get(ApplicationRegistry);
  });
  afterEach(async () => await MicrofrontendPlatform.destroy());

  describe('app base URL', () => {

    it('should be the origin of \'manifestUrl\' if no \'baseUrl\' is specified in the manifest', () => {
      registerApp({symbolicName: 'app-1', manifestUrl: 'http://manifest-domain:80/manifest.json'});
      expect(registry.getApplication('app-1')!.baseUrl).toEqual('http://manifest-domain/');
      expect(registry.getApplication('app-1')!.manifestUrl).toEqual('http://manifest-domain/manifest.json');

      registerApp({symbolicName: 'app-2', manifestUrl: 'http://manifest-domain/manifest.json'});
      expect(registry.getApplication('app-2')!.baseUrl).toEqual('http://manifest-domain/');
      expect(registry.getApplication('app-2')!.manifestUrl).toEqual('http://manifest-domain/manifest.json');

      registerApp({symbolicName: 'app-3', manifestUrl: 'https://manifest-domain/manifest.json'});
      expect(registry.getApplication('app-3')!.baseUrl).toEqual('https://manifest-domain/');
      expect(registry.getApplication('app-3')!.manifestUrl).toEqual('https://manifest-domain/manifest.json');

      registerApp({symbolicName: 'app-4', manifestUrl: 'http://manifest-domain:42/manifest.json'});
      expect(registry.getApplication('app-4')!.baseUrl).toEqual('http://manifest-domain:42/');
      expect(registry.getApplication('app-4')!.manifestUrl).toEqual('http://manifest-domain:42/manifest.json');

      registerApp({symbolicName: 'app-5', manifestUrl: 'http://manifest-domain'});
      expect(registry.getApplication('app-5')!.baseUrl).toEqual('http://manifest-domain/');
      expect(registry.getApplication('app-5')!.manifestUrl).toEqual('http://manifest-domain/');

      registerApp({symbolicName: 'app-6', manifestUrl: 'http://manifest-domain:8080/manifest.json'});
      expect(registry.getApplication('app-6')!.baseUrl).toEqual('http://manifest-domain:8080/');
      expect(registry.getApplication('app-6')!.manifestUrl).toEqual('http://manifest-domain:8080/manifest.json');
    });

    it('should be the \'baseUrl\' as specified in the manifest (if \'baseUrl\' is an absolute URL)', () => {
      registerApp({symbolicName: 'app-1', manifestUrl: 'http://manifest-domain:80/manifest', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-1')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-1')!.manifestUrl).toEqual('http://manifest-domain/manifest');

      registerApp({symbolicName: 'app-2', manifestUrl: 'http://manifest-domain/manifest', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-2')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-2')!.manifestUrl).toEqual('http://manifest-domain/manifest');

      registerApp({symbolicName: 'app-3', manifestUrl: 'https://manifest-domain/manifest', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-3')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-3')!.manifestUrl).toEqual('https://manifest-domain/manifest');

      registerApp({symbolicName: 'app-4', manifestUrl: 'https://app-domain/manifest', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-4')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-4')!.manifestUrl).toEqual('https://app-domain/manifest');

      registerApp({symbolicName: 'app-5', manifestUrl: 'http://app-domain:42/manifest', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-5')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-5')!.manifestUrl).toEqual('http://app-domain:42/manifest');

      registerApp({symbolicName: 'app-6', manifestUrl: 'http://app-domain', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-6')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-6')!.manifestUrl).toEqual('http://app-domain/');

      registerApp({symbolicName: 'app-7', manifestUrl: 'http://app-domain:8080', baseUrl: 'http://app-domain/app'});
      expect(registry.getApplication('app-7')!.baseUrl).toEqual('http://app-domain/app/');
      expect(registry.getApplication('app-7')!.manifestUrl).toEqual('http://app-domain:8080/');
    });

    it('should be the \'baseUrl\' as specified in the manifest relative to the origin of \'manifestUrl\' (if \'baseUrl\' is a relative URL)', () => {
      registerApp({symbolicName: 'app-1', manifestUrl: 'http://manifest-domain:80/manifest', baseUrl: 'app'});
      expect(registry.getApplication('app-1')!.baseUrl).toEqual('http://manifest-domain/app/');
      expect(registry.getApplication('app-1')!.manifestUrl).toEqual('http://manifest-domain/manifest');

      registerApp({symbolicName: 'app-2', manifestUrl: 'http://manifest-domain/manifest', baseUrl: 'app'});
      expect(registry.getApplication('app-2')!.baseUrl).toEqual('http://manifest-domain/app/');
      expect(registry.getApplication('app-2')!.manifestUrl).toEqual('http://manifest-domain/manifest');

      registerApp({symbolicName: 'app-3', manifestUrl: 'https://manifest-domain/manifest', baseUrl: 'app'});
      expect(registry.getApplication('app-3')!.baseUrl).toEqual('https://manifest-domain/app/');
      expect(registry.getApplication('app-3')!.manifestUrl).toEqual('https://manifest-domain/manifest');

      registerApp({symbolicName: 'app-4', manifestUrl: 'http://manifest-domain:42/manifest', baseUrl: 'app'});
      expect(registry.getApplication('app-4')!.baseUrl).toEqual('http://manifest-domain:42/app/');
      expect(registry.getApplication('app-4')!.manifestUrl).toEqual('http://manifest-domain:42/manifest');

      registerApp({symbolicName: 'app-5', manifestUrl: 'http://manifest-domain', baseUrl: 'app'});
      expect(registry.getApplication('app-5')!.baseUrl).toEqual('http://manifest-domain/app/');
      expect(registry.getApplication('app-5')!.manifestUrl).toEqual('http://manifest-domain/');

      registerApp({symbolicName: 'app-6', manifestUrl: 'http://manifest-domain:8080', baseUrl: 'app'});
      expect(registry.getApplication('app-6')!.baseUrl).toEqual('http://manifest-domain:8080/app/');
      expect(registry.getApplication('app-6')!.manifestUrl).toEqual('http://manifest-domain:8080/');
    });

    it('should use the origin of the window if the manifest URL is relative', () => {
      registerApp({symbolicName: 'app-1', manifestUrl: '/assets/manifest.json'});
      expect(registry.getApplication('app-1')!.baseUrl).toEqual(window.origin + '/');
      expect(registry.getApplication('app-1')!.manifestUrl).toEqual(window.origin + '/assets/manifest.json');

      registerApp({symbolicName: 'app-2', manifestUrl: 'manifest.json'});
      expect(registry.getApplication('app-2')!.baseUrl).toEqual(window.origin + '/');
      expect(registry.getApplication('app-2')!.manifestUrl).toEqual(window.origin + '/manifest.json');

      registerApp({symbolicName: 'app-3', manifestUrl: '/manifest.json'});
      expect(registry.getApplication('app-3')!.baseUrl).toEqual(window.origin + '/');
      expect(registry.getApplication('app-3')!.manifestUrl).toEqual(window.origin + '/manifest.json');

      registerApp({symbolicName: 'app-4', manifestUrl: 'assets/manifest.json'});
      expect(registry.getApplication('app-4')!.baseUrl).toEqual(window.origin + '/');
      expect(registry.getApplication('app-4')!.manifestUrl).toEqual(window.origin + '/assets/manifest.json');

      registerApp({symbolicName: 'app-5', manifestUrl: 'assets/manifest.json', baseUrl: 'app'});
      expect(registry.getApplication('app-5')!.baseUrl).toEqual(window.origin + '/app/');
      expect(registry.getApplication('app-5')!.manifestUrl).toEqual(window.origin + '/assets/manifest.json');

      registerApp({symbolicName: 'app-6', manifestUrl: '/assets/manifest.json', baseUrl: 'app'});
      expect(registry.getApplication('app-6')!.baseUrl).toEqual(window.origin + '/app/');
      expect(registry.getApplication('app-6')!.manifestUrl).toEqual(window.origin + '/assets/manifest.json');

      registerApp({symbolicName: 'app-7', manifestUrl: '/assets/manifest.json', baseUrl: 'https://www.some-origin.com'});
      expect(registry.getApplication('app-7')!.baseUrl).toEqual('https://www.some-origin.com/');
      expect(registry.getApplication('app-7')!.manifestUrl).toEqual(window.origin + '/assets/manifest.json');
    });

    function registerApp(app: {symbolicName: string; manifestUrl: string; baseUrl?: string}): Promise<void> {
      return registry.registerApplication({symbolicName: app.symbolicName, manifestUrl: app.manifestUrl}, {
        name: app.symbolicName,
        capabilities: [],
        intentions: [],
        baseUrl: app.baseUrl,
      });
    }
  });

  describe('symbolic app name', () => {

    it('should be unique', async () => {
      await registerApp({symbolicName: 'app-1'});
      await expectAsync(registerApp({symbolicName: 'app-1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
    });

    it('should be lowercase and contain alphanumeric and/or dash characters', async () => {
      await registerApp({symbolicName: 'app-1'});
      await expectAsync(registerApp({symbolicName: 'APP-1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app.1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app#1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app/1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app\\1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app&1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app?1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: ' app-1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app-1 '})).toBeRejectedWithError(/ApplicationRegistrationError/);
      await expectAsync(registerApp({symbolicName: 'app 1'})).toBeRejectedWithError(/ApplicationRegistrationError/);
    });

    function registerApp(app: {symbolicName: string}): Promise<void> {
      return registry.registerApplication({symbolicName: app.symbolicName, manifestUrl: 'http://www.some-origin.com'}, {
        name: app.symbolicName,
        capabilities: [],
        intentions: [],
      });
    }
  });

  it('should use the application\'s symbolic name as application name if not configured in the manifest', async () => {
    await registry.registerApplication({symbolicName: 'app', manifestUrl: 'http://app.com/manifest'}, {name: undefined!});
    expect(registry.getApplication('app')!.name).toEqual('app');
    expect(registry.getApplication('app')!.symbolicName).toEqual('app');
  });

  it('should set the application\'s manifest origin as allowed message origin', async () => {
    await registry.registerApplication({symbolicName: 'app', manifestUrl: 'https://app.com/manifest'}, {name: 'App'});
    expect(registry.getApplication('app')!.allowedMessageOrigins).toEqual(new Set().add('https://app.com'));
  });

  it('should set the application\'s base origin as allowed message origin', async () => {
    await registry.registerApplication({symbolicName: 'app', manifestUrl: 'https://app.com/manifest'}, {name: 'App', baseUrl: 'https://primary.app.com'});
    expect(registry.getApplication('app')!.allowedMessageOrigins).toEqual(new Set().add('https://primary.app.com'));
  });

  it('should add secondary origin to the allowed message origins (1/2)', async () => {
    await registry.registerApplication({symbolicName: 'app', manifestUrl: 'https://app.com/manifest', secondaryOrigin: 'https://secondary.app.com'}, {name: 'App'});
    expect(registry.getApplication('app')!.allowedMessageOrigins).toEqual(new Set().add('https://app.com').add('https://secondary.app.com'));
  });

  it('should add secondary origin to the allowed message origins (2/2)', async () => {
    await registry.registerApplication({symbolicName: 'app', manifestUrl: 'https://app.com/manifest', secondaryOrigin: 'https://secondary.app.com'}, {name: 'App', baseUrl: 'https://primary.app.com'});
    expect(registry.getApplication('app')!.allowedMessageOrigins).toEqual(new Set().add('https://primary.app.com').add('https://secondary.app.com'));
  });
});
