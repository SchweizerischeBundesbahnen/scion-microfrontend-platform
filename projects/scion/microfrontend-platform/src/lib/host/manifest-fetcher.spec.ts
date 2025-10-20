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
import {Manifest} from '../platform.model';
import {Beans} from '@scion/toolkit/bean-manager';
import {ManifestFetcher} from './manifest-fetcher';
import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';

describe('ManifestFetcher', () => {

  beforeEach(() => Beans.destroy());
  afterEach(() => Beans.destroy());

  it('should fetch manifest', async () => {
    const platformConfig: MicrofrontendPlatformConfig = {applications: []};
    const manifest: Manifest = {name: 'Application'};

    // mock {HttpClient}
    const httpClientSpy = jasmine.createSpyObj<HttpClient>(HttpClient.name, ['fetch']);
    httpClientSpy.fetch.withArgs('http://app/manifest').and.returnValue(okAnswer({body: manifest, delay: 100}));
    Beans.register(HttpClient, {useValue: httpClientSpy});
    Beans.register(MicrofrontendPlatformConfig, {useValue: platformConfig});
    Beans.register(ManifestFetcher);

    await expectAsync(Beans.get(ManifestFetcher).fetch({symbolicName: 'app', manifestUrl: 'http://app/manifest'})).toBeResolvedTo(manifest);
  });

  it('should throw if manifest cannot be fetched', async () => {
    const platformConfig: MicrofrontendPlatformConfig = {applications: []};

    // mock {HttpClient}
    const httpClientSpy = jasmine.createSpyObj<HttpClient>(HttpClient.name, ['fetch']);
    httpClientSpy.fetch.withArgs('http://app/manifest').and.returnValue(nokAnswer({status: 500, delay: 100}));
    Beans.register(HttpClient, {useValue: httpClientSpy});
    Beans.register(MicrofrontendPlatformConfig, {useValue: platformConfig});
    Beans.register(ManifestFetcher);

    await expectAsync(Beans.get(ManifestFetcher).fetch({symbolicName: 'app', manifestUrl: 'http://app/manifest'})).toBeRejectedWithError(/ManifestFetchError/);
  });

  it('should cancel fetching manifest if manifest load timeout expires', async () => {
    const platformConfig: MicrofrontendPlatformConfig = {applications: []};

    // mock {HttpClient}
    const httpClientSpy = jasmine.createSpyObj<HttpClient>(HttpClient.name, ['fetch']);
    httpClientSpy.fetch.withArgs('http://app/manifest').and.returnValue(okAnswer({body: {name: 'Application'}, delay: 1000})); // greater than the app-specific manifestLoadTimeout
    Beans.register(HttpClient, {useValue: httpClientSpy});
    Beans.register(MicrofrontendPlatformConfig, {useValue: platformConfig});
    Beans.register(ManifestFetcher);

    await expectAsync(Beans.get(ManifestFetcher).fetch({symbolicName: 'app', manifestUrl: 'http://app/manifest', manifestLoadTimeout: 500})).toBeRejectedWithError(/\[ManifestFetchError].*Timeout of 500ms elapsed/);
  });

  it('should cancel fetching manifest if global manifest load timeout expires', async () => {
    const platformConfig: MicrofrontendPlatformConfig = {applications: [], manifestLoadTimeout: 300};

    // mock {HttpClient}
    const httpClientSpy = jasmine.createSpyObj<HttpClient>(HttpClient.name, ['fetch']);
    httpClientSpy.fetch.withArgs('http://app/manifest').and.returnValue(okAnswer({body: {name: 'Application'}, delay: 1000})); // greater than the global manifestLoadTimeout
    Beans.register(HttpClient, {useValue: httpClientSpy});
    Beans.register(MicrofrontendPlatformConfig, {useValue: platformConfig});
    Beans.register(ManifestFetcher);

    await expectAsync(Beans.get(ManifestFetcher).fetch({symbolicName: 'app', manifestUrl: 'http://app/manifest'})).toBeRejectedWithError(/\[ManifestFetchError].*Timeout of 300ms elapsed/);
  });

  it('should error if passing an invalid application config', async () => {
    Beans.register(ManifestFetcher);

    await expectAsync(Beans.get(ManifestFetcher).fetch({symbolicName: undefined!, manifestUrl: 'http://app/manifest'})).toBeRejectedWithError(/\[ManifestFetchError].*Invalid application config/);
    await expectAsync(Beans.get(ManifestFetcher).fetch({symbolicName: 'app', manifestUrl: undefined!})).toBeRejectedWithError(/\[ManifestFetchError].*Invalid application config/);
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
