/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ClientRegistry} from './client.registry';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {MicrofrontendPlatformHost} from '../microfrontend-platform-host';
import {Beans} from '@scion/toolkit/bean-manager';
import {ɵClient} from './ɵclient';
import {Client} from './client';
import {ɵApplication, ɵVERSION} from '../../ɵplatform.model';

describe('ClientRegistry', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should register a client by its id', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const client1 = newClient('1', 'app-1');
    const client2 = newClient('2', 'app-2');
    Beans.get(ClientRegistry).registerClient(client1);
    Beans.get(ClientRegistry).registerClient(client2);

    expect(Beans.get(ClientRegistry).getByClientId(client1.id)).toBe(client1);
    expect(Beans.get(ClientRegistry).getByClientId(client2.id)).toBe(client2);
  });

  it('should register a client by its window', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const client1 = newClient('1', 'app-1');
    const client2 = newClient('2', 'app-2');
    Beans.get(ClientRegistry).registerClient(client1);
    Beans.get(ClientRegistry).registerClient(client2);

    expect(Beans.get(ClientRegistry).getByWindow(client1.window)).toBe(client1);
    expect(Beans.get(ClientRegistry).getByWindow(client2.window)).toBe(client2);
  });

  it('should register a client by its application', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const client1 = newClient('1', 'app-1');
    const client2 = newClient('2', 'app-1');
    const client3 = newClient('3', 'app-1');
    const client4 = newClient('4', 'app-2');
    const client5 = newClient('5', 'app-2');
    Beans.get(ClientRegistry).registerClient(client1);
    Beans.get(ClientRegistry).registerClient(client2);
    Beans.get(ClientRegistry).registerClient(client3);
    Beans.get(ClientRegistry).registerClient(client4);
    Beans.get(ClientRegistry).registerClient(client5);

    expect(Beans.get(ClientRegistry).getByApplication('app-1')).toEqual(jasmine.arrayWithExactContents([client1, client2, client3]));
    expect(Beans.get(ClientRegistry).getByApplication('app-2')).toEqual(jasmine.arrayWithExactContents([client4, client5]));
  });

  it('should unregister a client', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const client = newClient('1', 'app-1');
    Beans.get(ClientRegistry).registerClient(client);

    expect(Beans.get(ClientRegistry).getByClientId(client.id)).toBe(client);
    expect(Beans.get(ClientRegistry).getByWindow(client.window)).toBe(client);
    expect(Beans.get(ClientRegistry).getByApplication('app-1')).toEqual([client]);

    Beans.get(ClientRegistry).unregisterClient(client);
    expect(Beans.get(ClientRegistry).getByClientId(client.id)).toBeUndefined();
    expect(Beans.get(ClientRegistry).getByWindow(client.window)).toBeUndefined();
    expect(Beans.get(ClientRegistry).getByApplication('app-1')).toEqual([]);
  });

  function newClient(clientId: string, appSymbolicName: string): Client {
    const application: Partial<ɵApplication> = {symbolicName: appSymbolicName};
    return new ɵClient(clientId, {} as Window, 'origin', application as ɵApplication, Beans.get(ɵVERSION));
  }
});
