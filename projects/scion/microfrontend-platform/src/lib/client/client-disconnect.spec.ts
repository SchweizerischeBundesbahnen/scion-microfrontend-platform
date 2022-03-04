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
import {ManifestFixture} from '../testing/manifest-fixture/manifest-fixture';
import {Beans} from '@scion/toolkit/bean-manager';
import {ClientRegistry} from '../host/client-registry/client.registry';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {installLoggerSpies, readConsoleLog} from '../testing/spec.util.spec';
import {STALE_CLIENT_UNREGISTER_DELAY} from '../host/client-registry/client.constants';
import {filter} from 'rxjs/operators';

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

  it('should disconnect the client when loading a SCION micro application into its window', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client-1',
          manifestUrl: new ManifestFixture({name: 'Client 1'}).serve(),
        },
        {
          symbolicName: 'client-2',
          manifestUrl: new ManifestFixture({name: 'Client 2'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client 1
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client-1'});
    const client1Id = await getClientId(microfrontendFixture);
    expect(clientRegistry.getByClientId(client1Id)).withContext('expected "client-1" to be CONNECTED').toBeDefined();

    // Load client 2
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client-2'});
    const client2Id = await getClientId(microfrontendFixture);

    // Expect client 1 to be disconnected
    expect(clientRegistry.getByClientId(client1Id)).withContext('expected "client-1" to be DISCONNECTED').toBeUndefined();
    // Expect client 2 to be connected
    expect(clientRegistry.getByClientId(client2Id)).withContext('expected "client-2" to be CONNECTED').toBeDefined();
  });

  it('should disconnect the client when loading a non-SCION app into its window', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client'});
    const clientId = await getClientId(microfrontendFixture);
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be CONNECTED').toBeDefined();

    // Navigate to "about:blank"
    microfrontendFixture.setUrl('about:blank');
    await waitUntilClientUnregistered(clientId);

    // Expect client to be disconnected
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client-1" to be DISCONNECTED').toBeUndefined();
  });

  it('should disconnect the client when it navigates to a SCION micro application', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client-1',
          manifestUrl: new ManifestFixture({name: 'Client 1'}).serve(),
        },
        {
          symbolicName: 'client-2',
          manifestUrl: new ManifestFixture({name: 'Client 2'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Serve script of client 2. Client 1 will then navigate to that script via 'location.href'.
    const client2ScriptHandle = microfrontendFixture.serveScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client-2'});

    // Load client 1
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHostThenLocationHref', {symbolicName: 'client-1', locationHref: client2ScriptHandle.url});
    const client1Id = await getClientId(microfrontendFixture);

    // Wait until script of client 2 completed loading.
    await client2ScriptHandle.whenLoaded;
    const client2Id = await getClientId(microfrontendFixture);

    // Expect client 1 to be disconnected
    expect(clientRegistry.getByClientId(client1Id)).withContext('expected "client-1" to be DISCONNECTED').toBeUndefined();
    // Expect client 2 to be connected
    expect(clientRegistry.getByClientId(client2Id)).withContext('expected "client-2" to be CONNECTED').toBeDefined();
  });

  it('should disconnect the client when it navigates to a non-SCION app', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHostThenLocationHref', {symbolicName: 'client', locationHref: 'about:blank'});
    const clientId = await getClientId(microfrontendFixture);

    await waitUntilClientUnregistered(clientId);
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be DISCONNECTED').toBeUndefined();
  });

  it('should disconnect the client when removing its iframe', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client'});
    const clientId = await getClientId(microfrontendFixture);
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be CONNECTED').toBeDefined();

    // Remove the iframe
    microfrontendFixture.removeIframe();
    await waitUntilClientUnregistered(clientId);

    // Expect client to be disconnected
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be DISCONNECTED').toBeUndefined();
  });

  it('should disconnect the client when stopping its platform', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHostThenStopPlatform', {symbolicName: 'client'});
    const clientId = await getClientId(microfrontendFixture);

    // Expect client to be disconnected
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be DISCONNECTED').toBeUndefined();
  });

  it('should disconnect client if not receiving a "DISCONNECT" when loading a SCION micro application into its window (staleness)', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client-1',
          manifestUrl: new ManifestFixture({name: 'Client 1'}).serve(),
        },
        {
          symbolicName: 'client-2',
          manifestUrl: new ManifestFixture({name: 'Client 2'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client 1 (disconnectOnUnloadDisabled: true)
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client-1', disconnectOnUnloadDisabled: true});
    const client1Id = await getClientId(microfrontendFixture);
    expect(clientRegistry.getByClientId(client1Id)).withContext('expected "client-1" to be CONNECTED').toBeDefined();

    // Load client 2
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client-2'});
    const client2Id = await getClientId(microfrontendFixture);

    // Expect client 1 to be disconnected
    expect(clientRegistry.getByClientId(client1Id)).withContext('expected "client-1" to be DISCONNECTED').toBeUndefined();
    // Expect client 2 to be connected
    expect(clientRegistry.getByClientId(client2Id)).withContext('expected "client-2" to be CONNECTED').toBeDefined();

    // Assert staleness warning
    expect(readConsoleLog('warn', {filter: /\[StaleClient]/})).toEqual(jasmine.arrayContaining([jasmine.stringMatching(`Stale client registration detected when loading application 'client-2' into the window of 'client-1'.`)]));
  });

  it('should disconnect client if not receiving a "DISCONNECT" when loading a non-SCION app into its window (staleness)', async () => {
    Beans.register(STALE_CLIENT_UNREGISTER_DELAY, {useValue: 100});

    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
      heartbeatInterval: .1,
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client (disconnectOnUnloadDisabled: true)
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client', disconnectOnUnloadDisabled: true});
    const clientId = await getClientId(microfrontendFixture);
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be CONNECTED').toBeDefined();

    // Load page
    await microfrontendFixture.setUrl('about:blank');
    await waitUntilClientUnregistered(clientId);

    // Expect client to be disconnected
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be DISCONNECTED').toBeUndefined();

    // Assert staleness warning
    expect(readConsoleLog('warn', {filter: /\[StaleClient]/})).toEqual(jasmine.arrayContaining([jasmine.stringMatching(`Stale client registration of application 'client' detected.`)]));
  });

  it('should disconnect client if not receiving a "DISCONNECT" when removing its iframe (staleness)', async () => {
    Beans.register(STALE_CLIENT_UNREGISTER_DELAY, {useValue: 100});

    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
      heartbeatInterval: .1,
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    const clientRegistry = Beans.get(ClientRegistry);

    // Load client (disconnectOnUnloadDisabled: true)
    await microfrontendFixture.loadScript('./lib/client/client-disconnect.script.ts', 'connectToHost', {symbolicName: 'client', disconnectOnUnloadDisabled: true});
    const clientId = await getClientId(microfrontendFixture);

    // Expect client to be connected
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be CONNECTED').toBeDefined();

    // Remove the client.
    microfrontendFixture.removeIframe();
    await waitUntilClientUnregistered(clientId);

    // Expect client to be disconnected
    expect(clientRegistry.getByClientId(clientId)).withContext('expected "client" to be DISCONNECTED').toBeUndefined();

    // Assert staleness warning
    expect(readConsoleLog('warn', {filter: /\[StaleClient]/})).toEqual(jasmine.arrayContaining([jasmine.stringMatching(`Stale client registration of application 'client' detected.`)]));
  });

  async function getClientId(fixture: MicrofrontendFixture): Promise<string> {
    const captor = new ObserveCaptor<string>();
    fixture.message$.subscribe(captor);
    return captor.getLastValue();
  }

  function waitUntilClientUnregistered(clientId: string): Promise<void> {
    const captor = new ObserveCaptor();
    Beans.get(ClientRegistry).unregister$
      .pipe(filter(client => client.id === clientId))
      .subscribe(captor);
    return captor.waitUntilEmitCount(1);
  }

  /**
   * Registers the fixture for destruction after test execution.
   */
  function registerFixture(fixture: MicrofrontendFixture): MicrofrontendFixture {
    disposables.add(() => fixture.removeIframe());
    return fixture;
  }
});

type Disposable = () => void;
