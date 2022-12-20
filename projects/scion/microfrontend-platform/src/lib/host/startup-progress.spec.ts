/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ObserveCaptor} from '@scion/toolkit/testing';
import {MicrofrontendPlatform} from '../microfrontend-platform';
import {MicrofrontendPlatformHost} from './microfrontend-platform-host';

describe('StartupProgress', () => {

  beforeEach(() => MicrofrontendPlatform.destroy());
  afterEach(() => MicrofrontendPlatform.destroy());

  it('should reset progress Observable when re-starting the platform (and not construct new Observable)', async () => {
    // Get reference to the startup progress Observable
    const startupProgress$ = MicrofrontendPlatformHost.startupProgress$;

    // Start the platform
    const captor1 = new ObserveCaptor();
    startupProgress$.subscribe(captor1);

    await MicrofrontendPlatformHost.start({applications: []});
    expect(captor1.getValues()).toEqual([0, 33.33, 88.89, 100]);
    expect(captor1.hasCompleted()).toBeTrue();

    // Stop the platform
    await MicrofrontendPlatform.destroy();

    // Start the platform again
    const captor2 = new ObserveCaptor();
    startupProgress$.subscribe(captor2);

    await MicrofrontendPlatformHost.start({applications: []});
    expect(captor2.getValues()).toEqual([0, 33.33, 88.89, 100]);
    expect(captor2.hasCompleted()).toBeTrue();
  });

  it('should complete progress Observable if the platform has already been started', async () => {
    // Start the platform
    await MicrofrontendPlatformHost.start({applications: []});

    // Expect startup Observable to emit 100 and then complete.
    const captor = new ObserveCaptor();
    MicrofrontendPlatformHost.startupProgress$.subscribe(captor);
    expect(captor.getValues()).toEqual([100]);
    expect(captor.hasCompleted()).toBeTrue();
  });

  it('should not emit progress if not startet yet, report progress during startup, and complete after started', async () => {
    // Expect no emission if the platform is not yet started
    const captor1 = new ObserveCaptor<number>();
    MicrofrontendPlatformHost.startupProgress$.subscribe(captor1);
    expect(captor1.getValues()).toEqual([]); // no emission
    expect(captor1.hasCompleted()).toBeFalse();

    await MicrofrontendPlatformHost.start({applications: []});
    // Expect the progress to be 100% after the platform is started and the Observable to be completed.
    expect(captor1.getLastValue()).toEqual(100);
    expect(captor1.hasCompleted()).toBeTrue();

    await MicrofrontendPlatform.destroy();
    // Expect no emission if the platform is not yet started
    const captor2 = new ObserveCaptor<number>();
    MicrofrontendPlatformHost.startupProgress$.subscribe(captor2);
    expect(captor2.getValues()).toEqual([]); // no emission
    expect(captor2.hasCompleted()).toBeFalse();

    await MicrofrontendPlatformHost.start({applications: []});
    // Expect the progress to be 100% after the platform completed startup and the Observable to be completed.
    expect(captor2.getLastValue()).toEqual(100);
    expect(captor2.hasCompleted()).toBeTrue();
  });
});
