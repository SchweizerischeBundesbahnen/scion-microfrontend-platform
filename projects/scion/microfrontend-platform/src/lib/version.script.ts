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
import {ɵVERSION} from './platform.model';

export async function connectToHost({symbolicName, version = undefined}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  if (version !== undefined) {
    Beans.register(ɵVERSION, {useValue: version});
  }
  await MicrofrontendPlatform.connectToHost(symbolicName);
}
