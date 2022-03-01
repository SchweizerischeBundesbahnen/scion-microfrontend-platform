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
import {Beans} from '@scion/toolkit/bean-manager';
import {VERSION} from './version';

export async function connectToHost({symbolicName, version = undefined}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  if (version !== undefined) {
    setMicrofrontendPlatformVersion(version);
  }
  await MicrofrontendPlatform.connectToHost(symbolicName);
}

/**
 * Instructs platform to operate on given version.
 */
function setMicrofrontendPlatformVersion(version: string): void {
  Beans.registerInitializer({
    useFunction: async () => void (Beans.register(VERSION, {useValue: version})),
    runlevel: 0,
  });
}
