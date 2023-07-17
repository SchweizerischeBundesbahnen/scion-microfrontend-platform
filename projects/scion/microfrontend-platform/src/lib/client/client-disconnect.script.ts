/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatform} from '../microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {Observer} from 'rxjs';
import {MicrofrontendPlatformStopper} from '../microfrontend-platform-stopper';
import {ɵBrokerGateway} from './messaging/broker-gateway';
import {ɵVERSION} from '../ɵplatform.model';
import {MicrofrontendPlatformClient} from './microfrontend-platform-client';

export async function connectToHost(args: {symbolicName: string; disconnectOnUnloadDisabled?: boolean; version?: string}, observer: Observer<string>): Promise<void> {
  const disconnectOnUnloadDisabled = args.disconnectOnUnloadDisabled ?? false;

  if (disconnectOnUnloadDisabled) {
    Beans.register(MicrofrontendPlatformStopper, {useClass: NullMicrofrontendPlatformStopper});
  }
  if (args.version) {
    Beans.register(ɵVERSION, {useValue: args.version});
  }
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  observer.next(Beans.get(ɵBrokerGateway).session!.clientId);
}

export async function connectToHostThenStopPlatform(args: {symbolicName: string}, observer: Observer<string>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  observer.next(Beans.get(ɵBrokerGateway).session!.clientId);
  await MicrofrontendPlatform.destroy();
}

export async function connectToHostThenLocationHref(args: {symbolicName: string; locationHref: string}, observer: Observer<string>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  observer.next(Beans.get(ɵBrokerGateway).session!.clientId);
  window.location.href = args.locationHref;
}

class NullMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper {
}
