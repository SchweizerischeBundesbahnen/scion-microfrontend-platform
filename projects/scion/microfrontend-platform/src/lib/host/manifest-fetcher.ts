/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';
import {HttpClient} from './http-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {firstValueFrom, from, identity, Observable, throwError, timeout} from 'rxjs';
import {Manifest} from '../platform.model';
import {ApplicationConfig} from './application-config';

/**
 * Fetches the manifest of an application.
 *
 * @internal
 */
export class ManifestFetcher {

  /**
   * Fetches the manifest for given application.
   *
   * @return Promise that resolves to the manifest after successful retrieval, or that rejects if the manifest could not be fetched
   *         or the maximum retrieval time has elapsed.
   *         See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful.
   */
  public async fetch(appConfig: ApplicationConfig): Promise<Manifest> {
    if (!appConfig.symbolicName) {
      throw Error('[ManifestFetchError] Invalid application config. Missing required property \'symbolicName\'.');
    }
    if (!appConfig.manifestUrl) {
      throw Error('[ManifestFetchError] Invalid application config. Missing required property \'manifestUrl\'.');
    }

    const fetchManifest$ = from(Beans.get(HttpClient).fetch(appConfig.manifestUrl));
    const manifestFetchTimeout = appConfig.manifestLoadTimeout ?? Beans.get(MicrofrontendPlatformConfig).manifestLoadTimeout;
    const onManifestFetchTimeout = (): Observable<never> => throwError(() => Error(`[ManifestFetchError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Timeout of ${manifestFetchTimeout}ms elapsed.`));
    const manifestFetchResponse = await firstValueFrom(fetchManifest$.pipe(manifestFetchTimeout ? timeout({first: manifestFetchTimeout, with: onManifestFetchTimeout}) : identity));

    if (!manifestFetchResponse.ok) {
      throw Error(`[ManifestFetchError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Maybe the application is currently unavailable. [httpStatusCode=${manifestFetchResponse.status}, httpStatusText=${manifestFetchResponse.statusText}]`);
    }

    return await manifestFetchResponse.json() as Manifest;
  }
}
