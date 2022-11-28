/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Beans} from '@scion/toolkit/bean-manager';
import {HostAppConfigProvider} from './host-app-config-provider';
import {ManifestFetcher} from './manifest-fetcher';
import {ApplicationRegistry} from './application-registry';
import {HostConfig} from './host-config';
import {ApplicationConfig} from './application-config';
import {Logger} from '../logger';
import {ManifestLoadProgressMonitor} from './progress-monitor/progress-monitors';

/**
 * Installs registered applications in the platform.
 *
 * @ignore
 */
export class AppInstaller {

  private readonly _appConfigs: ApplicationConfig[];

  constructor(private _hostConfig: HostConfig & {symbolicName: string}, appConfigs: ApplicationConfig[]) {
    this._appConfigs = appConfigs.filter(appConfig => !appConfig.exclude);
  }

  /**
   * Installs registered applications in the platform.
   */
  public async install(): Promise<void> {
    // Create config for the host.
    const hostAppConfig = HostAppConfigProvider.createAppConfig(this._hostConfig);
    const appConfigs = [hostAppConfig, ...this._appConfigs];
    const manifestLoadMonitors = Beans.get(ManifestLoadProgressMonitor).splitEven(appConfigs.length);

    // Fetch manifests and register applications.
    await Promise.all(appConfigs.map(async appConfig => {
      const monitor = manifestLoadMonitors.shift()!;
      try {
        // Fetch the manifest.
        const manifest = await Beans.get(ManifestFetcher).fetch(appConfig);

        // Let interceptors intercept the host manifest, for example by libraries integrating the SCION Microfrontend Platform,
        // e.g., to contribute integrator-specific capabilities and intentions.
        if (appConfig === hostAppConfig) {
          HostAppConfigProvider.interceptManifest(manifest);
        }

        // Register application in the platform.
        await Beans.get(ApplicationRegistry).registerApplication(appConfig, manifest);
        Beans.get(Logger).info(`Registered application '${appConfig.symbolicName}' in the SCION Microfrontend Platform.`);
      }
      catch (error) {
        Beans.get(Logger).error(`[AppInstaller] Failed to install application '${appConfig.symbolicName}' in the SCION Microfrontend Platform.`, error);
      }
      finally {
        monitor.done();
      }
    }));
  }
}
