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
import {MicrofrontendPlatformHost} from './host/microfrontend-platform-host';
import {MicrofrontendFixture} from './testing/microfrontend-fixture/microfrontend-fixture';
import {ManifestFixture} from './testing/manifest-fixture/manifest-fixture';
import {Beans} from '@scion/toolkit/bean-manager';
import {installLoggerSpies, readConsoleLog} from './testing/spec.util.spec';
import {ɵVERSION} from './ɵplatform.model';

describe('Deprecated APIs', () => {

  const disposables = new Set<Disposable>();

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
    installLoggerSpies();
  });

  afterEach(async () => {
    await MicrofrontendPlatform.destroy();
    disposables.forEach(disposable => disposable());
  });

  it('should warn if client does not support liveness probes introduced in version "1.0.0-rc.11"', async () => {
    Beans.register(ɵVERSION, {useValue: '1.0.0'});

    await MicrofrontendPlatformHost.start({
      applications: [
        {
          symbolicName: 'app',
          manifestUrl: new ManifestFixture({name: 'App'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('lib/version.script.ts', 'connectToHost', {symbolicName: 'app', version: '1.0.0-rc.10'});

    // Assert deprecation warning
    expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual(jasmine.arrayContaining([
      `[DEPRECATION][CD981D7] Application "app" is using a legacy liveness probe protocol. Please update @scion/microfrontend-platform to version '1.0.0'. Legacy support will be dropped in version '2.0.0'.`,
    ]));
  });

  it('should warn if client does not support intent subscription protocol introduced in version "1.0.0-rc.8"', async () => {
    Beans.register(ɵVERSION, {useValue: '1.0.0'});

    await MicrofrontendPlatformHost.start({
      applications: [
        {
          symbolicName: 'app',
          manifestUrl: new ManifestFixture({name: 'App'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('lib/version.script.ts', 'connectToHost', {symbolicName: 'app', version: '1.0.0-rc.7'});

    // Assert deprecation warning
    expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual(jasmine.arrayContaining([
      `[DEPRECATION][FE93C94] Application "app" is using a legacy protocol for subscribing to intents. Please update @scion/microfrontend-platform to version '1.0.0'. Legacy support will be dropped in version '2.0.0'.`,
    ]));
  });

  it('should warn if client does not support request-response communication protocol introduced in version "1.0.0-rc.9"', async () => {
    Beans.register(ɵVERSION, {useValue: '1.0.0'});

    await MicrofrontendPlatformHost.start({
      applications: [
        {
          symbolicName: 'app',
          manifestUrl: new ManifestFixture({name: 'App'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await microfrontendFixture.loadScript('lib/version.script.ts', 'connectToHost', {symbolicName: 'app', version: '1.0.0-rc.7'});

    // Assert deprecation warning
    expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual(jasmine.arrayContaining([
      `[DEPRECATION][F6DC38E] Application "app" is using a legacy request-response communication protocol. Please update @scion/microfrontend-platform to version '1.0.0'. Legacy support will be dropped in version '2.0.0'.`,
    ]));
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
