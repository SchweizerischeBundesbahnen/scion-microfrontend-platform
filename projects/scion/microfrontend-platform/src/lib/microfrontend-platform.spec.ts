/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { AbstractType, BeanInfo, Beans, Type } from './bean-manager';
import { MicrofrontendPlatform } from './microfrontend-platform';
import { MessageClient } from './client/messaging/message-client';
import { PlatformState, PlatformStates } from './platform-state';
import { ApplicationConfig } from './host/platform-config';
import { HostPlatformState } from './client/host-platform-state';
import { serveManifest, waitFor } from './spec.util.spec';
import { PlatformMessageClient } from './host/platform-message-client';

describe('MicrofrontendPlatform', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should report that the app is not connected to the platform host when the host platform is not found', async () => {
    await MicrofrontendPlatform.connectToHost({symbolicName: 'client-app', messaging: {brokerDiscoverTimeout: 250}});
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
    await expectAsync(MicrofrontendPlatform.connectToHost({symbolicName: 'A', messaging: {enabled: false}})).toBeResolved();
    expect(Beans.get(PlatformState).state).toEqual(PlatformStates.Started);
  });

  it('should reject starting the client platform multiple times', async () => {
    await expectAsync(MicrofrontendPlatform.connectToHost({symbolicName: 'A', messaging: {enabled: false}})).toBeResolved();

    try {
      await MicrofrontendPlatform.connectToHost({symbolicName: 'A'});
      fail('expected \'MicrofrontendPlatform.forClient()\' to error');
    }
    catch (error) {
      await expect(error.message).toMatch(/\[PlatformStateError] Failed to enter platform state \[prevState=Started, newState=Starting]/);
    }
  });

  it('should reject starting the host platform multiple times', async () => {
    await expectAsync(MicrofrontendPlatform.startHost([])).toBeResolved();

    try {
      await MicrofrontendPlatform.startHost([]);
      fail('expected \'MicrofrontendPlatform.startHost()\' to error');
    }
    catch (error) {
      await expect(error.message).toMatch(/\[PlatformStateError] Failed to enter platform state \[prevState=Started, newState=Starting]/);
    }
  });

  it('should allow clients to wait until the host platform started', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250, deliveryTimeout: 250}});

    await expectAsync(Beans.get(HostPlatformState).whenStarted()).toBeResolved();
  });

  it('should register the `MessageClient` as alias for `PlatformMessageClient` when starting the host platform without app', async () => {
    await MicrofrontendPlatform.startHost([]);

    expect(getBeanInfo(MessageClient)).toEqual(jasmine.objectContaining({useExisting: PlatformMessageClient}));
    expect(Beans.get(MessageClient)).toBe(Beans.get(PlatformMessageClient));
  });

  it('should not register the `MessageClient` as alias for `PlatformMessageClient` when starting the host platform with an app', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250, deliveryTimeout: 250}});

    expect(getBeanInfo(MessageClient)).toEqual(jasmine.objectContaining({eager: true, destroyPhase: PlatformStates.Stopped}));
    expect(getBeanInfo(PlatformMessageClient)).toEqual(jasmine.objectContaining({eager: true, destroyPhase: PlatformStates.Stopped}));
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

    expect(constructed).toBeTruthy();
  });

  it('should not construct lazy beans at platform startup', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    await MicrofrontendPlatform.startPlatform(() => {
      Beans.register(Bean, {eager: false});
    });

    expect(constructed).toBeFalse();
  });

  it('should construct eager beans in the order as registered', async () => {
    const beanConstructionOrder: Type<any>[] = [];

    class Bean1 {
      constructor() {
        beanConstructionOrder.push(Bean1);
      }
    }

    class Bean2 {
      constructor() {
        beanConstructionOrder.push(Bean2);
      }
    }

    class Bean3 {
      constructor() {
        beanConstructionOrder.push(Bean3);
      }
    }

    await MicrofrontendPlatform.startPlatform(() => {
      Beans.register(Bean1, {eager: true});
      Beans.register(Bean2, {eager: true});
      Beans.register(Bean3, {eager: true});
    });

    expect(beanConstructionOrder).toEqual([Bean1, Bean2, Bean3]);
  });

  it('should construct eager beans in runlevel 1', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    const log: string[] = [];
    Beans.registerInitializer({useFunction: () => void (log.push(`initializer-runlevel-0 [eagerBeanConstructed=${constructed}]`)), runlevel: 0});
    Beans.registerInitializer({useFunction: () => void (log.push(`initializer-runlevel-2 [eagerBeanConstructed=${constructed}]`)), runlevel: 2});

    await MicrofrontendPlatform.startPlatform(() => {
      Beans.register(Bean, {eager: true});
    });

    expect(constructed).toBeTrue();
    expect(log).toEqual([
      'initializer-runlevel-0 [eagerBeanConstructed=false]',
      'initializer-runlevel-2 [eagerBeanConstructed=true]',
    ]);
  });

  it('should not construct eager beans when initializers of runlevel 0 reject (eager beans are constructed in runlevel 1)', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    Beans.registerInitializer({useFunction: () => Promise.reject(), runlevel: 0});

    try {
      await MicrofrontendPlatform.startPlatform(() => {
        Beans.register(Bean, {eager: true});
      });
    }
    catch {
      // noop
    }

    expect(constructed).toBeFalse();
  });

  it('should run initializers when starting the platform', async () => {
    const log: string[] = [];

    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 0')),
      runlevel: 0,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 1')),
      runlevel: 1,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 2')),
      runlevel: 2,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer (no runlevel specified)')),
    });

    await MicrofrontendPlatform.startPlatform();

    await expect(log).toEqual([
      'initializer runlevel 0',
      'initializer runlevel 1',
      'initializer runlevel 2',
      'initializer (no runlevel specified)',
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
    await expect(started).toBeTrue();

    jasmine.clock().uninstall();
  });
});

function getBeanInfo<T>(symbol: Type<T | any> | AbstractType<T | any>): BeanInfo<T> {
  return Array.from(Beans.getBeanInfo<T>(symbol) || new Set<BeanInfo<T>>())[0];
}

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
