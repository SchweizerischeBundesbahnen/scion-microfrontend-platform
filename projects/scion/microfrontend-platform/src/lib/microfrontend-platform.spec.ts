/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { MicrofrontendPlatform } from './microfrontend-platform';
import { MessageClient } from './client/messaging/message-client';
import { ApplicationConfig } from './host/platform-config';
import { expectPromise, serveManifest, waitFor } from './spec.util.spec';
import { PlatformMessageClient } from './host/platform-message-client';
import { PlatformState } from './platform-state';
import { Beans } from '@scion/toolkit/bean-manager';

describe('MicrofrontendPlatform', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should report that the app is not connected to the platform host when the host platform is not found', async () => {
    const startup = MicrofrontendPlatform.connectToHost({symbolicName: 'client-app', messaging: {brokerDiscoverTimeout: 250}});
    await expectPromise(startup).toReject();
    await expect(await MicrofrontendPlatform.isConnectedToHost()).toBe(false);
  });

  it('should report that the app is not connected to the platform host when the client platform is not started', async () => {
    await expect(await MicrofrontendPlatform.isConnectedToHost()).toBe(false);
  });

  it('should report that the app is connected to the platform host when connected', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});
    await expect(await MicrofrontendPlatform.isConnectedToHost()).toBe(true);
  });

  it('should enter state \'started\' when started', async () => {
    const startup = MicrofrontendPlatform.connectToHost({symbolicName: 'A', messaging: {enabled: false}});

    await expectPromise(startup).toResolve();
    expect(MicrofrontendPlatform.state).toEqual(PlatformState.Started);
  });

  it('should reject starting the client platform multiple times', async () => {
    const startup = MicrofrontendPlatform.connectToHost({symbolicName: 'A', messaging: {enabled: false}});
    await expectPromise(startup).toResolve();

    try {
      await MicrofrontendPlatform.connectToHost({symbolicName: 'A'});
      fail('expected \'MicrofrontendPlatform.forClient()\' to error');
    }
    catch (error) {
      await expect(error.message).toMatch(/\[PlatformStateError] Failed to enter platform state \[prevState=Started, newState=Starting]/);
    }
  });

  it('should reject starting the host platform multiple times', async () => {
    const startup = MicrofrontendPlatform.startHost([]);
    await expectPromise(startup).toResolve();

    try {
      await MicrofrontendPlatform.startHost([]);
      fail('expected \'MicrofrontendPlatform.startHost()\' to error');
    }
    catch (error) {
      await expect(error.message).toMatch(/\[PlatformStateError] Failed to enter platform state \[prevState=Started, newState=Starting]/);
    }
  });

  it('should register the `MessageClient` as alias for `PlatformMessageClient` when starting the host platform anonymously', async () => {
    await MicrofrontendPlatform.startHost([]);

    expect(Beans.get(MessageClient)).toBe(Beans.get(PlatformMessageClient));
  });

  it('should not register the `MessageClient` as alias for `PlatformMessageClient` when starting the host platform in the name of an app', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250, deliveryTimeout: 250}});

    expect(Beans.get(MessageClient)).not.toBe(Beans.get(PlatformMessageClient));
  });

  it('should construct eager beans at platform startup', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    await MicrofrontendPlatform.startPlatform(() => {
      Beans.register(Bean, {eager: true});
    });

    expect(constructed).toBeTrue();
  });

  it('should construct eager beans in runlevel 1', async () => {
    const log: string[] = [];

    class Bean {
      constructor() {
        log.push('constructing eager bean');
      }
    }

    Beans.registerInitializer({useFunction: () => void (log.push('executing initializer [runlevel=0]')), runlevel: 0});
    Beans.registerInitializer({useFunction: () => void (log.push('executing initializer [runlevel=2]')), runlevel: 2});

    await MicrofrontendPlatform.startPlatform(() => {
      Beans.register(Bean, {eager: true});
    });

    expect(log).toEqual([
      'executing initializer [runlevel=0]',
      'constructing eager bean',
      'executing initializer [runlevel=2]',
    ]);
  });

  it('should wait for initializers to complete before resolving the platform\'s startup promise', async () => {
    jasmine.clock().install();

    const log: string[] = [];

    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(5000);
        log.push('initializer 5s');
      },
    });

    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(2000);
        log.push('initializer 2s');
      },
    });

    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(8000);
        log.push('initializer 8s');
      },
    });

    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(6000);
        log.push('initializer 6s');
      },
    });

    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(1000);
        log.push('initializer 1s [runlevel 5]');
      },
      runlevel: 5,
    });

    let started = false;
    MicrofrontendPlatform.startPlatform().then(() => {
      started = true;
    });
    await drainMicrotaskQueue(100);

    // after 1s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual([]);
    await expect(started).toBeFalse();

    // after 2s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s']);
    await expect(started).toBeFalse();

    // after 3s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s']);
    await expect(started).toBeFalse();

    // after 4s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s']);
    await expect(started).toBeFalse();

    // after 5s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s', 'initializer 5s']);
    await expect(started).toBeFalse();

    // after 6s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s', 'initializer 5s', 'initializer 6s']);
    await expect(started).toBeFalse();

    // after 7s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s', 'initializer 5s', 'initializer 6s']);
    await expect(started).toBeFalse();

    // after 8s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s', 'initializer 5s', 'initializer 6s', 'initializer 8s']);
    await expect(started).toBeFalse();

    // after 9s
    jasmine.clock().tick(1000);
    await drainMicrotaskQueue(100);
    await expect(log).toEqual(['initializer 2s', 'initializer 5s', 'initializer 6s', 'initializer 8s', 'initializer 1s [runlevel 5]']);

    // assert the platform to be started
    await expect(started).toBeTrue();

    jasmine.clock().uninstall();
  });

  it('should resolve the \'start\' Promise when all initializers resolve', async () => {
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.resolve());

    await expectPromise(MicrofrontendPlatform.startPlatform()).toResolve();
  });

  it('should reject the \'start\' Promise when an initializer rejects', async () => {
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.reject());
    Beans.registerInitializer(() => Promise.resolve());

    await expectPromise(MicrofrontendPlatform.startPlatform()).toReject(/PlatformStartupError/);
  });
});

/**
 * Waits until all microtasks currently in the microtask queue completed. When this method returns,
 * the microtask queue may still not be empty, that is, when microtasks are scheduling other microtasks.
 *
 * @param drainCycles the number of microtask cycles to wait for. Default is 1.
 */
async function drainMicrotaskQueue(drainCycles: number = 1): Promise<void> {
  for (let i = 0; i < drainCycles; i++) {
    await Promise.resolve();
  }
}
