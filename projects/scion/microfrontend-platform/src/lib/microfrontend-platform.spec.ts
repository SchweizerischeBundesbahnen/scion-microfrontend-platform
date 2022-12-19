/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatform} from './microfrontend-platform';
import {waitFor} from './testing/spec.util.spec';
import {PlatformState} from './platform-state';
import {Beans} from '@scion/toolkit/bean-manager';
import {PlatformPropertyService} from './platform-property-service';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('MicrofrontendPlatform', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should report that the app is not connected to the platform host when the host platform is not found', async () => {
    const startup = MicrofrontendPlatform.connectToHost('client-app', {brokerDiscoverTimeout: 250});
    await expectAsync(startup).toBeRejected();
    await expect(await MicrofrontendPlatform.isConnectedToHost()).toBeFalse();
  });

  it('should report that the app is not connected to the platform host when the client platform is not started', async () => {
    await expect(await MicrofrontendPlatform.isConnectedToHost()).toBeFalse();
  });

  it('should report that the app is connected to the platform host when connected', async () => {
    await MicrofrontendPlatform.startHost({applications: []});
    await expect(await MicrofrontendPlatform.isConnectedToHost()).toBeTrue();
  });

  it('should enter state \'started\' when started', async () => {
    const startup = MicrofrontendPlatform.connectToHost('A', {connect: false});

    await expectAsync(startup).toBeResolved();
    expect(MicrofrontendPlatform.state).toEqual(PlatformState.Started);
  });

  it('should reject starting the client platform multiple times', async () => {
    const connect = MicrofrontendPlatform.connectToHost('A', {connect: false});
    await expectAsync(connect).toBeResolved();
    // Connect to the host again
    await expectAsync(MicrofrontendPlatform.connectToHost('A')).toBeRejectedWithError(/\[MicrofrontendPlatformStartupError] Platform already started/);
  });

  it('should reject starting the host platform multiple times', async () => {
    const startup = MicrofrontendPlatform.startHost({applications: []});
    await expectAsync(startup).toBeResolved();
    // Start the platform again
    await expectAsync(MicrofrontendPlatform.startHost({applications: []})).toBeRejectedWithError(/\[MicrofrontendPlatformStartupError] Platform already started/);
  });

  it('should construct eager beans at platform startup', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    await MicrofrontendPlatform.startPlatform(async () => {
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

    await MicrofrontendPlatform.startPlatform(async () => {
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

    await expectAsync(MicrofrontendPlatform.startPlatform()).toBeResolved();
  });

  it('should reject the \'start\' Promise when an initializer rejects', async () => {
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.reject());
    Beans.registerInitializer(() => Promise.resolve());

    await expectAsync(MicrofrontendPlatform.startPlatform()).toBeRejectedWithError(/MicrofrontendPlatformStartupError/);
  });

  it('should allow looking up platform properties from the host', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [],
      properties: {
        'prop1': 'PROP1',
        'prop2': 'PROP2',
        'prop3': 'PROP3',
      },
    });

    expect(Beans.get(PlatformPropertyService).properties()).toEqual(new Map()
      .set('prop1', 'PROP1')
      .set('prop2', 'PROP2')
      .set('prop3', 'PROP3'),
    );
  });

  it('should not emit progress if not startet yet, report progress during startup, and complete after started', async () => {
    const captor1 = new ObserveCaptor<number>();
    const captor2 = new ObserveCaptor<number>();

    // Expect no emission if the platform is not yet started
    MicrofrontendPlatform.startupProgress$.subscribe(captor1);
    expect(captor1.getValues()).toEqual([]); // no emission

    await MicrofrontendPlatform.startHost({applications: []});

    // Expect the progress to be 100% after the platform is started and the Observable to be completed.
    expect(captor1.getLastValue()).toEqual(100);
    expect(captor1.hasCompleted()).toBeTrue();

    await MicrofrontendPlatform.destroy();

    // Expect no emission if the platform is not yet started
    MicrofrontendPlatform.startupProgress$.subscribe(captor2);
    expect(captor2.getValues()).toEqual([]); // no emission

    await MicrofrontendPlatform.startHost({applications: []});

    // Expect the progress to be 100% after the platform completed startup and the Observable to be completed.
    expect(captor2.getLastValue()).toEqual(100);
    expect(captor2.hasCompleted()).toBeTrue();
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
