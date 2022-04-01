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
import {VERSION} from '../version';
import {ɵBrokerGateway} from './messaging/broker-gateway';

export async function connectToHost({symbolicName, disconnectOnUnloadDisabled = false, version = undefined}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  if (disconnectOnUnloadDisabled) {
    Beans.register(MicrofrontendPlatformStopper, {useClass: NullMicrofrontendPlatformStopper});
  }
  if (version) {
    Beans.register(VERSION, {useValue: version});
  }
  await MicrofrontendPlatform.connectToHost(symbolicName);
  observer.next(Beans.get(ɵBrokerGateway).brokerInfo.clientId);
}

export async function connectToHostThenStopPlatform({symbolicName}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  observer.next(Beans.get(ɵBrokerGateway).brokerInfo.clientId);
  await MicrofrontendPlatform.destroy();
}

export async function connectToHostThenLocationHref({symbolicName, locationHref}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  observer.next(Beans.get(ɵBrokerGateway).brokerInfo.clientId);
  window.location.href = locationHref;
}

class NullMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper {
}