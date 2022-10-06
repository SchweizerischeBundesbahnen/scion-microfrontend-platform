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
import {fromEvent, mergeWith, Observer} from 'rxjs';
import {ɵBrokerGateway} from './messaging/broker-gateway';
import {MessagingTransport} from '../ɵmessaging.model';
import {ɵWINDOW_TOP} from '../platform.model';
import {filterByTransport} from '../operators';

export async function connectToHost({symbolicName, brokerDiscoverTimeout, connectCount}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName, {brokerDiscoverTimeout});
  observer.next(Beans.get(ɵBrokerGateway).brokerInfo.clientId);

  for (let i = 1; i < connectCount; i++) {
    const {clientId} = await Beans.get(ɵBrokerGateway).connectToBroker();
    observer.next(clientId);
  }
}

export async function connectClientToRemoteHost({symbolicName, brokerDiscoverTimeout}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  Beans.register(ɵWINDOW_TOP, {useValue: window}); // simulate to be loaded into the top-level window
  await MicrofrontendPlatform.connectToHost(symbolicName, {brokerDiscoverTimeout});
  observer.next(Beans.get(ɵBrokerGateway).brokerInfo.clientId);
}

/**
 * Bridges messages between host and client.
 */
export async function bridgeMessages(): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  const hostWindow = window.parent;
  const clientWindow = window.parent.document['X-CLIENT-WINDOW'];

  // Bridge messages from the client to the remote host
  fromEvent<MessageEvent>(clientWindow, 'message') // dispatch connect message(s)
    .pipe(
      mergeWith(fromEvent<MessageEvent>(window, 'message')), // dispatch messages sent directly to the broker (host)
      filterByTransport(MessagingTransport.ClientToBroker),
    )
    .subscribe(event => {
      hostWindow.postMessage(event.data);
    });

  // Bridge messages from the the remote host to the client
  fromEvent<MessageEvent>(window, 'message')
    .pipe(filterByTransport(MessagingTransport.BrokerToClient))
    .subscribe(event => {
      clientWindow.postMessage(event.data);
    });
}
