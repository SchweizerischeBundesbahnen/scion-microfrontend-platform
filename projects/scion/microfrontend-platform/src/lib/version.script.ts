/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatformClient} from './client/microfrontend-platform-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {ɵVERSION} from './ɵplatform.model';

export async function connectToHost(args: {symbolicName: string; version?: string}): Promise<void> {
  if (args.version !== undefined) {
    Beans.register(ɵVERSION, {useValue: args.version});
  }
  await MicrofrontendPlatformClient.connect(args.symbolicName);
}
