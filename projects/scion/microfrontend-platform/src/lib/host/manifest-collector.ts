/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';
import {ApplicationRegistry} from './application-registry';
import {HttpClient} from './http-client';
import {Logger} from '../logger';
import {Beans, Initializer} from '@scion/toolkit/bean-manager';
import {ProgressMonitor} from './progress-monitor/progress-monitor';
import {ManifestLoadProgressMonitor} from './progress-monitor/progress-monitors';
import {from} from 'rxjs';
import {timeoutIfPresent} from '../operators';
import {APP_IDENTITY, Manifest, ɵAPP_CONFIG} from '../platform.model';
import {HostManifestInterceptor} from './host-manifest-interceptor';
import {ApplicationConfig} from './application-config';

/**
 * Collects manifests of registered applications.
 *
 * This collector is registered as {@link Initializer}. The platform waits to initialize until manifests are collected.
 * @ignore
 */
export class ManifestCollector implements Initializer {

  public async init(): Promise<void> {
    await Promise.all(this.fetchAndRegisterManifests());
  }

  private fetchAndRegisterManifests(): Promise<void>[] {
    const appConfigs = Beans.all<ApplicationConfig>(ɵAPP_CONFIG);
    const monitor = Beans.get(ManifestLoadProgressMonitor);
    if (!appConfigs.length) {
      monitor.done();
      return [];
    }

    const subMonitors = monitor.splitEven(appConfigs.length);
    return appConfigs.map((appConfig, index) => this.fetchAndRegisterManifest(appConfig, subMonitors[index]));
  }

  private async fetchAndRegisterManifest(appConfig: ApplicationConfig, monitor: ProgressMonitor): Promise<void> {
    if (!appConfig.manifestUrl) {
      Beans.get(Logger).error(`[AppConfigError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Manifest URL must not be empty.`);
      return;
    }

    try {
      const response = await from(Beans.get(HttpClient).fetch(appConfig.manifestUrl))
        .pipe(timeoutIfPresent(appConfig.manifestLoadTimeout ?? Beans.get(MicrofrontendPlatformConfig).manifestLoadTimeout))
        .toPromise();

      if (!response.ok) {
        Beans.get(Logger).error(`[ManifestFetchError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Maybe the application is currently unavailable. [httpStatusCode=${response.status}, httpStatusText=${response.statusText}]`, appConfig, response.status);
        return;
      }

      const manifest: Manifest = await response.json();

      // Let the host manifest be intercepted before registering it in the platform, for example by libraries integrating the SCION Microfrontend Platform, e.g., to allow the programmatic registration of capabilities or intentions.
      if (appConfig.symbolicName === Beans.get<string>(APP_IDENTITY)) {
        Beans.all(HostManifestInterceptor).forEach(interceptor => interceptor.intercept(manifest));
      }

      Beans.get(ApplicationRegistry).registerApplication(appConfig, manifest);
      Beans.get(Logger).info(`Registered application '${appConfig.symbolicName}' in the SCION Microfrontend Platform.`);
    }
    catch (error) {
      // The Promise returned from fetch() won’t reject on HTTP error status even if the response is an HTTP 404 or 500.
      // It will only reject on network failure or if anything prevented the request from completing.
      // See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful
      Beans.get(Logger).error(`[ManifestFetchError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Maybe the application is currently unavailable.`, error);
    }
    finally {
      monitor.done();
    }
  }
}
