/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { PlatformConfigLoader } from './platform-config-loader';
import { Defined } from '@scion/toolkit/util';
import { ApplicationConfig, PlatformConfig, PlatformFlags } from './platform-config';
import { ApplicationRegistry } from './application-registry';
import { HttpClient } from './http-client';
import { Logger } from '../logger';
import { HostPlatformAppProvider } from './host-platform-app-provider';
import { PlatformMessageClient } from '../host/platform-message-client';
import { PlatformTopics } from '../ɵmessaging.model';
import { Beans, Initializer } from '@scion/toolkit/bean-manager';
import { Runlevel } from '../platform-state';
import { from } from 'rxjs';
import { timeoutIfPresent } from '../operators';

/**
 * Collects manifests of registered applications.
 *
 * This collector is registered as {@link Initializer}. The platform waits to initialize until manifests are collected.
 * @ignore
 */
export class ManifestCollector implements Initializer {

  public async init(): Promise<void> {
    // Load platform config
    const platformConfig: PlatformConfig = await Beans.get(PlatformConfigLoader).load();
    Defined.orElseThrow(platformConfig, () => Error('[PlatformConfigError] No platform config provided.'));
    Defined.orElseThrow(platformConfig.apps, () => Error('[PlatformConfigError] Missing \'apps\' property in platform config. Did you forget to register applications?'));
    Beans.register(PlatformFlags, {useValue: this.computePlatformFlags(platformConfig)});
    Beans.register(PlatformConfig, {useValue: platformConfig});

    // Load application manifests
    await Promise.all(this.fetchAndRegisterManifests(platformConfig));

    // Wait until messaging is enabled to avoid running into a publish timeout.
    Beans.whenRunlevel(Runlevel.Two).then(() => {
      Beans.get(PlatformMessageClient).publish(PlatformTopics.PlatformProperties, platformConfig.properties || {}, {retain: true});
      Beans.get(PlatformMessageClient).publish(PlatformTopics.Applications, Beans.get(ApplicationRegistry).getApplications(), {retain: true});
    });
  }

  private fetchAndRegisterManifests(platformConfig: PlatformConfig): Promise<void>[] {
    const appConfigs: ApplicationConfig[] = new Array<ApplicationConfig>()
      .concat(Beans.get(HostPlatformAppProvider).appConfig)
      .concat(platformConfig.apps)
      .filter(appConfig => !appConfig.exclude);

    return appConfigs.map(appConfig => this.fetchAndRegisterManifest(appConfig));
  }

  private async fetchAndRegisterManifest(appConfig: ApplicationConfig): Promise<void> {
    if (!appConfig.manifestUrl) {
      Beans.get(Logger).error(`[AppConfigError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Manifest URL must not be empty.`);
      return;
    }

    try {
      const response = await from(Beans.get(HttpClient).fetch(appConfig.manifestUrl))
        .pipe(timeoutIfPresent(appConfig.manifestLoadTimeout ?? platformConfig.manifestLoadTimeout))
        .toPromise();

      if (!response.ok) {
        Beans.get(Logger).error(`[ManifestFetchError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Maybe the application is currently unavailable. [httpStatusCode=${response.status}, httpStatusText=${response.statusText}]`, appConfig, response.status);
        return;
      }

      Beans.get(ApplicationRegistry).registerApplication(appConfig, await response.json());
      Beans.get(Logger).info(`Application '${appConfig.symbolicName}' registered as micro application in the platform.`);
    }
    catch (error) {
      // The Promise returned from fetch() won’t reject on HTTP error status even if the response is an HTTP 404 or 500.
      // It will only reject on network failure or if anything prevented the request from completing.
      // See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful
      Beans.get(Logger).error(`[ManifestFetchError] Failed to fetch manifest for application '${appConfig.symbolicName}'. Maybe the application is currently unavailable.`, error);
    }
  }

  private computePlatformFlags(platformConfig: PlatformConfig): PlatformFlags {
    return {
      ...platformConfig.platformFlags,
      activatorApiDisabled: Defined.orElse(platformConfig.platformFlags && platformConfig.platformFlags.activatorApiDisabled, false),
    };
  }
}
