/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {APP_IDENTITY, Manifest} from '../platform.model';
import {PlatformState} from '../platform-state';
import {Beans} from '@scion/toolkit/bean-manager';
import {PlatformStateRef} from '../platform-state-ref';
import {ApplicationConfig} from './application-config';
import {HostConfig} from './host-config';

/**
 * Creates the {@link ApplicationConfig} for the host app.
 */
export function createHostApplicationConfig(hostConfig: HostConfig | undefined): ApplicationConfig {
  return {
    symbolicName: Beans.get(APP_IDENTITY),
    manifestUrl: provideHostManifestUrl(hostConfig?.manifest),
    scopeCheckDisabled: hostConfig?.scopeCheckDisabled,
    intentionCheckDisabled: hostConfig?.intentionCheckDisabled,
    intentionRegisterApiDisabled: hostConfig?.intentionRegisterApiDisabled,
  };
}

function provideHostManifestUrl(hostManifest: string | Manifest | undefined): string {
  if (typeof hostManifest === 'string') {
    return hostManifest; // URL specified
  }

  return serveHostManifest(hostManifest || {name: 'Host Application'});
}

function serveHostManifest(manifest: Manifest): string {
  const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], {type: 'application/json'}));
  Beans.get(PlatformStateRef).whenState(PlatformState.Stopped).then(() => URL.revokeObjectURL(url));
  return url;
}
