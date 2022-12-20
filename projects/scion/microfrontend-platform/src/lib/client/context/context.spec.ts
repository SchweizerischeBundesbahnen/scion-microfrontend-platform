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
import {ContextService} from './context-service';
import {Beans} from '@scion/toolkit/bean-manager';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('Context', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should not complete the Observable when looking up context values from inside the host app (no context)', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const captor = new ObserveCaptor();
    Beans.get(ContextService).observe$('some-context').subscribe(captor);

    expect(captor.getValues()).toEqual([null]);
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should not complete the Observable when looking up the names of context values from inside the host app (no context)', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const captor = new ObserveCaptor();
    Beans.get(ContextService).names$().subscribe(captor);

    expect(captor.getValues()).toEqual([new Set()]);
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeFalse();
  });
});
