/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatform} from '../microfrontend-platform';
import {MicrofrontendFixture} from '../testing/microfrontend-fixture/microfrontend-fixture';
import {firstValueFrom, timer} from 'rxjs';
import {ManifestFixture} from '../testing/manifest-fixture/manifest-fixture';
import {Beans} from '@scion/toolkit/bean-manager';
import {ClientRegistry} from '../host/client-registry/client.registry';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('MicrofrontendPlatform', () => {

  const disposables = new Set<Disposable>();

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
  });

  afterEach(async () => {
    await MicrofrontendPlatform.destroy();
    disposables.forEach(disposable => disposable());
  });

  it('should throw if not connected to the host within the configured timeout', async () => {
    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const connectPromise = microfrontendFixture.loadScript('./lib/client/client-connect.script.ts', 'connectToHost', {symbolicName: 'client', brokerDiscoverTimeout: 250});
    await expectAsync(connectPromise).toBeRejectedWithError(/\[GatewayError] Message broker not discovered within 250ms/);
  });

  it('should retry to connect to the host', async () => {
    // Mount the client before starting the host, which means that the first connect request(s) are never answered.
    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const connectPromise = microfrontendFixture.loadScript('./lib/client/client-connect.script.ts', 'connectToHost', {symbolicName: 'client', brokerDiscoverTimeout: 2000});
    await firstValueFrom(timer(1000));

    // Start the host a little bit later.
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    // Expect client to be connected
    await expectAsync(connectPromise).toBeResolved();
    const clientId = await firstValueFrom(microfrontendFixture.message$);
    expect(Beans.get(ClientRegistry).getByClientId(clientId)).withContext('expected "client" to be CONNECTED').toBeDefined();
  });

  it('should ignore duplicate connect request of the same client', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('./lib/client/client-connect.script.ts', 'connectToHost', {symbolicName: 'client', connectCount: 3});

    const clients = Beans.get(ClientRegistry).getByApplication('client');
    expect(clients.length).toBe(1);
    const clientId = clients[0].id;

    const clientIdCaptor = new ObserveCaptor();
    microfrontendFixture.message$.subscribe(clientIdCaptor);

    expect(clientIdCaptor.getValues()).toEqual([clientId, clientId, clientId]);
  });

  it('should reject messages from wrong origin', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
          messageOrigin: 'http://wrong-origin.dev'
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const connectPromise = microfrontendFixture.loadScript('./lib/client/client-connect.script.ts', 'connectToHost', {symbolicName: 'client'});
    await expectAsync(connectPromise).toBeRejectedWithError(/\[MessageClientConnectError] Client connect attempt blocked by the message broker: Wrong origin \[actual='http:\/\/localhost:[\d]+', expected='http:\/\/wrong-origin.dev', app='client'] \[code: 'refused:blocked']/);
  });

  /**
   * Registers the fixture for destruction after test execution.
   */
  function registerFixture(fixture: MicrofrontendFixture): MicrofrontendFixture {
    disposables.add(() => fixture.removeIframe());
    return fixture;
  }
});

type Disposable = () => void;
