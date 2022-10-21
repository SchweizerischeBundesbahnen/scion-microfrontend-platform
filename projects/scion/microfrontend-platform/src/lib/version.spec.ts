/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatform} from './microfrontend-platform';
import {MicrofrontendFixture} from './testing/microfrontend-fixture/microfrontend-fixture';
import {ManifestFixture} from './testing/manifest-fixture/manifest-fixture';
import {Beans} from '@scion/toolkit/bean-manager';
import {installLoggerSpies, readConsoleLog} from './testing/spec.util.spec';
import {VERSION} from './version';

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

  it('should warn about client/host major version mismatch', async () => {
    setHostAppMicrofrontendPlatformVersion('2.0.0');

    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('./lib/version.script.ts', 'connectToHost', {symbolicName: 'client', version: '1.0.0'});

    // Assert version mismatch warning
    expect(readConsoleLog('warn', {filter: /\[VersionMismatch]/})).toEqual(jasmine.arrayContaining([
      `[VersionMismatch] Application 'client' uses a different major version of the @scion/microfrontend-platform than the host application, which may not be compatible. Please upgrade @scion/microfrontend-platform of application 'client' from version '1.0.0' to version '2.0.0'.`,
    ]));
  });

  it('should warn if clients connect without passing a version', async () => {
    setHostAppMicrofrontendPlatformVersion('1.0.0');

    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('./lib/version.script.ts', 'connectToHost', {symbolicName: 'client', version: null /* do not pass a version when connecting to the host */});

    // Assert version mismatch warning
    expect(readConsoleLog('warn', {filter: /\[VersionMismatch]/})).toEqual(jasmine.arrayContaining([
      `[VersionMismatch] Application 'client' uses a different major version of the @scion/microfrontend-platform than the host application, which may not be compatible. Please upgrade @scion/microfrontend-platform of application 'client' from version '0.0.0' to version '1.0.0'.`,
    ]));
  });

  it('should warn if client does not support heartbeat introduced in version "1.0.0-rc.1"', async () => {
    setHostAppMicrofrontendPlatformVersion('1.0.0');

    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('./lib/version.script.ts', 'connectToHost', {symbolicName: 'client', version: '1.0.0-beta.20'});

    // Assert version mismatch warning
    expect(readConsoleLog('warn', {filter: /\[VersionMismatch]/})).toEqual(jasmine.arrayContaining([
      `[VersionMismatch] Since '@scion/microfrontend-platform@1.0.0-rc.1', connected clients must send a heartbeat to indicate liveness. Please upgrade @scion/microfrontend-platform of application 'client' from version '1.0.0-beta.20' to version '1.0.0'.`,
    ]));
  });

  /**
   * Registers the fixture for destruction after test execution.
   */
  function registerFixture(fixture: MicrofrontendFixture): MicrofrontendFixture {
    disposables.add(() => fixture.removeIframe());
    return fixture;
  }

  /**
   * Instructs the host platform to operate on given version.
   */
  function setHostAppMicrofrontendPlatformVersion(version: string): void {
    Beans.registerInitializer({
      useFunction: async () => void (Beans.register(VERSION, {useValue: version})),
      runlevel: 0,
    });
  }
});

type Disposable = () => void;
