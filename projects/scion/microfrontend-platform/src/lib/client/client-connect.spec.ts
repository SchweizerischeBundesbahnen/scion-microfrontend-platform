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
import {expectPromise, getLoggerSpy, installLoggerSpies} from '../testing/spec.util.spec';

describe('MicrofrontendPlatform', () => {

  const disposables = new Set<Disposable>();

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
    installLoggerSpies();
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

  it('should repeatedly send a connect request when the client connects to a remote host', async () => {
    // Load the client.
    const clientFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const connectPromise = clientFixture.loadScript('./lib/client/client-connect.script.ts', 'connectClientToRemoteHost', {symbolicName: 'client', brokerDiscoverTimeout: 2000});
    document['X-CLIENT-WINDOW'] = clientFixture.iframe.contentWindow;

    // Wait some time before installing the host and bridge so that the first connect request will get lost.
    await firstValueFrom(timer(1000));

    // Start the  host.
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    // Install the message bridge.
    const messageBridgeFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await messageBridgeFixture.loadScript('./lib/client/client-connect.script.ts', 'bridgeMessages');

    // Expect the client to be connected.
    await expectAsync(connectPromise).toBeResolved();
    const clientId = await firstValueFrom(clientFixture.message$);
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

  it('should reject client connect attempt if the app is not registered', async () => {
    await MicrofrontendPlatform.startHost({applications: []}); // no app is registered

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    const script = microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'connectToHost', {symbolicName: 'bad-client'});

    await expectAsync(script).toBeRejectedWithError(/\[ClientConnectError] Client connect attempt rejected: Unknown client./);
  });

  it('should reject client connect attempt if the client\'s origin is different to the registered app origin', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client', baseUrl: 'http://app-origin'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    // Client connects under karma test runner origin (location.origin), but is registered under `http://app-origin`.
    const script = microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'connectToHost', {symbolicName: 'client'});

    await expectAsync(script).toBeRejectedWithError(/\[ClientConnectError] Client connect attempt blocked: Wrong origin./);
  });

  it('should accept client connect attempt if originating from the secondary origin', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client', baseUrl: 'http://app-origin'}).serve(),
          secondaryOrigin: location.origin
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    // - Client connects under karma test runner origin (location.origin)
    // - Base origin is 'app-origin'
    // - Application is configured to allow messages from secondary origin, which is karma test runner origin (location.origin)
    const script = microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'connectToHost', {symbolicName: 'client'});
    await expectAsync(script).toBeResolved();
  });

  it('should reject startup promise if the message broker cannot be discovered', async () => {
    const loggerSpy = getLoggerSpy('error');
    const startup = MicrofrontendPlatform.connectToHost('client-app', {brokerDiscoverTimeout: 250});
    await expectPromise(startup).toReject(/MicrofrontendPlatformStartupError/);

    await expect(loggerSpy).toHaveBeenCalledWith('[GatewayError] Message broker not discovered within 250ms. Messages cannot be published or received.');
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
