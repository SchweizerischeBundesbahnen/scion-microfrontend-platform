/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Manifest} from '../platform.model';
import {Beans} from '@scion/toolkit/bean-manager';
import {ApplicationConfig} from './application-config';
import {HostConfig} from './host-config';
import {MicrofrontendPlatform} from '../microfrontend-platform';
import {HostManifestInterceptor} from './host-manifest-interceptor';
import {PlatformState} from '../platform-state';

/**
 * Provides the config for the host app.
 *
 * NOTE: Use static class instead of namespace to be tree shakable, i.e., to not be included in client app.
 *
 * @internal
 */
export class HostAppConfigProvider {

  private constructor() {
  }

  /**
   * Creates the {@link ApplicationConfig} for the host app.
   */
  public static createAppConfig(hostConfig: HostConfig & {symbolicName: string}): ApplicationConfig {
    return {
      symbolicName: hostConfig.symbolicName,
      manifestUrl: provideHostManifestUrl(hostConfig.manifest),
      scopeCheckDisabled: hostConfig.scopeCheckDisabled,
      intentionCheckDisabled: hostConfig.intentionCheckDisabled,
      intentionRegisterApiDisabled: hostConfig.intentionRegisterApiDisabled,
    };
  }

  /**
   * Intercepts the host manifest by registered interceptors.
   */
  public static interceptManifest(manifest: Manifest): void {
    Beans.all(HostManifestInterceptor).forEach(interceptor => interceptor.intercept(manifest));
  }
}

function provideHostManifestUrl(hostManifest: string | Manifest | undefined): string {
  if (typeof hostManifest === 'string') {
    return hostManifest; // URL specified
  }
  return serveHostManifest(hostManifest || {name: 'Host Application'});
}

function serveHostManifest(manifest: Manifest): string {
  const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], {type: 'application/json'}));
  MicrofrontendPlatform.whenState(PlatformState.Stopped).then(() => URL.revokeObjectURL(url));
  return url;
}
