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
import {ɵBrokerGateway} from './messaging/broker-gateway';

export async function connectToHost({symbolicName, brokerDiscoverTimeout, connectCount}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName, {brokerDiscoverTimeout});
  observer.next(Beans.get(ɵBrokerGateway).brokerInfo.clientId);

  for (let i = 1; i < connectCount; i++) {
    const {clientId} = await Beans.get(ɵBrokerGateway).connectToBroker();
    observer.next(clientId);
  }
}
