/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {HttpClient} from './http-client';
import {MicrofrontendPlatform} from '../microfrontend-platform';
import {MicrofrontendPlatformHost} from './microfrontend-platform-host';
import {Manifest} from '../platform.model';
import {ApplicationRegistry} from './application-registry';
import {Beans} from '@scion/toolkit/bean-manager';
import {ManifestService} from '../client/manifest-registry/manifest-service';
import {ManifestFixture} from '../testing/manifest-fixture/manifest-fixture';
import {getLoggerSpy, installLoggerSpies} from '../testing/spec.util.spec';

describe('AppInstaller', () => {

  beforeEach(() => {
    MicrofrontendPlatform.destroy();
    installLoggerSpies();
  });
  afterEach(() => MicrofrontendPlatform.destroy());

  it('should fetch and register applications', async () => {
    // mock {HttpClient}
    const httpClientSpy = {
      fetch: vi.fn((url: string) => {
        switch (url) {
          case 'http://www.app-1/manifest':
            return okAnswer({body: {name: 'App 1'}, delay: 120});
          case 'http://www.app-2/manifest':
            return okAnswer({body: {name: 'App 2'}, delay: 30});
          default:
            return fetch(url); // fetches the manifest of the host app;
        }
      }),
    } satisfies HttpClient;
    Beans.register(HttpClient, {useValue: httpClientSpy});

    // start the platform
    await MicrofrontendPlatformHost.start({
      host: {
        symbolicName: 'host-app',
        manifest: new ManifestFixture({name: 'Host App'}).serve(),
      },
      applications: [
        {symbolicName: 'app-1', manifestUrl: 'http://www.app-1/manifest'},
        {symbolicName: 'app-2', manifestUrl: 'http://www.app-2/manifest'},
      ],
    });

    // assert application registrations
    expect(Beans.get(ApplicationRegistry).getApplication('host-app').name).toEqual('Host App');
    expect(Beans.get(ApplicationRegistry).getApplication('app-1').name).toEqual('App 1');
    expect(Beans.get(ApplicationRegistry).getApplication('app-2').name).toEqual('App 2');

    expect(Beans.get(ManifestService).applications).toEqual(expect.arrayContaining([
      expect.objectContaining({symbolicName: 'host-app'}),
      expect.objectContaining({symbolicName: 'app-1'}),
      expect.objectContaining({symbolicName: 'app-2'}),
    ]));
  });

  it('should ignore applications which are not available', async () => {
    // mock {HttpClient}
    const httpClientSpy = {
      fetch: vi.fn((url: string) => {
        switch (url) {
          case 'http://www.app-1/manifest':
            return okAnswer({body: {name: 'App 1'}, delay: 12});
          case 'http://www.app-2/manifest':
            return nokAnswer({status: 500, delay: 100});
          case 'http://www.app-3/manifest':
            return okAnswer({body: {name: 'App 3'}, delay: 600});
          case 'http://www.app-4/manifest':
            return nokAnswer({status: 502, delay: 200});
          default:
            return fetch(url); // fetches the manifest of the host app;
        }
      }),
    } satisfies HttpClient;
    Beans.register(HttpClient, {useValue: httpClientSpy});

    // start the platform
    await MicrofrontendPlatformHost.start({
      applications: [
        {symbolicName: 'app-1', manifestUrl: 'http://www.app-1/manifest'},
        {symbolicName: 'app-2', manifestUrl: 'http://www.app-2/manifest'},
        {symbolicName: 'app-3', manifestUrl: 'http://www.app-3/manifest'},
        {symbolicName: 'app-4', manifestUrl: 'http://www.app-4/manifest'},
      ],
    });

    // assert application registrations
    expect(Beans.get(ApplicationRegistry).getApplication('app-1').name).toEqual('App 1');
    expect(() => Beans.get(ApplicationRegistry).getApplication('app-2')).toThrow(/NullApplicationError/);
    expect(Beans.get(ApplicationRegistry).getApplication('app-3').name).toEqual('App 3');
    expect(() => Beans.get(ApplicationRegistry).getApplication('app-4')).toThrow(/NullApplicationError/);
    expect(getLoggerSpy('error')).callCount(2);
  });

  it('should cancel fetching an application\'s manifest after the timeout expires and not register it', async () => {
    // mock {HttpClient}
    const httpClientSpy = {
      fetch: vi.fn((url: string) => {
        switch (url) {
          case 'http://www.app-1/manifest':
            return okAnswer({body: {name: 'App 1'}, delay: 1000}); // greater than the app-specific manifestLoadTimeout => expect failure
          case 'http://www.app-2/manifest':
            return okAnswer({body: {name: 'App 2'}, delay: 1});
          case 'http://www.app-3/manifest':
            return okAnswer({body: {name: 'App 3'}, delay: 600}); // greater than the global manifestLoadTimeout => expect failure
          case 'http://www.app-4/manifest':
            return okAnswer({body: {name: 'App 4'}, delay: 600}); // less than the app-specific manifestLoadTimeout => expect success
          default:
            return fetch(url); // fetches the manifest of the host app;
        }
      }),
    } satisfies HttpClient;
    Beans.register(HttpClient, {useValue: httpClientSpy});

    // start the platform
    await MicrofrontendPlatformHost.start({
      applications: [
        {symbolicName: 'app-1', manifestUrl: 'http://www.app-1/manifest', manifestLoadTimeout: 300}, // app-specific timeout
        {symbolicName: 'app-2', manifestUrl: 'http://www.app-2/manifest'},
        {symbolicName: 'app-3', manifestUrl: 'http://www.app-3/manifest'},
        {symbolicName: 'app-4', manifestUrl: 'http://www.app-4/manifest', manifestLoadTimeout: 700}, // app-specific timeout
      ],
      manifestLoadTimeout: 500, // global
    });

    // assert application registrations
    expect(() => Beans.get(ApplicationRegistry).getApplication('app-1')).toThrow(/NullApplicationError/);
    expect(Beans.get(ApplicationRegistry).getApplication('app-2').name).toEqual('App 2');
    expect(() => Beans.get(ApplicationRegistry).getApplication('app-3')).toThrow(/NullApplicationError/);
    expect(Beans.get(ApplicationRegistry).getApplication('app-4').name).toEqual('App 4');
    expect(getLoggerSpy('error')).callCount(2);
    expect(getLoggerSpy('error')).toHaveBeenCalledWith(expect.objectContaining(/\[AppInstaller] Failed to install application/), expect.objectContaining(/\[ManifestFetchError] Failed to fetch manifest for application 'app-1'\. Timeout of 300ms elapsed/));
    expect(getLoggerSpy('error')).toHaveBeenCalledWith(expect.objectContaining(/\[AppInstaller] Failed to install application/), expect.objectContaining(/\[ManifestFetchError] Failed to fetch manifest for application 'app-3'\. Timeout of 500ms elapsed/));
  });
});

function okAnswer(answer: {body: Manifest; delay: number}): Promise<Response> {
  const response = {
    ok: true,
    json: (): Promise<unknown> => Promise.resolve(answer.body),
  } as Response;
  return new Promise(resolve => {
    setTimeout(() => resolve(response), answer.delay);
  });
}

function nokAnswer(answer: {status: number; delay: number}): Promise<Response> {
  const response = {
    ok: false,
    status: answer.status,
  } as Response;
  return new Promise(resolve => {
    setTimeout(() => resolve(response), answer.delay);
  });
}
