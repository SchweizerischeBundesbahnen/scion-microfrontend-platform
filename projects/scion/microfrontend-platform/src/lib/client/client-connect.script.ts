/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatformClient} from './microfrontend-platform-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {fromEvent, mergeWith, Observer} from 'rxjs';
import {ɵBrokerGateway} from './messaging/broker-gateway';
import {MessagingTransport} from '../ɵmessaging.model';
import {ɵWINDOW_TOP} from '../ɵplatform.model';
import {filterByTransport} from '../operators';

export async function connectToHost(args: {symbolicName: string; brokerDiscoverTimeout: number; connectCount: number}, observer: Observer<string>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName, {brokerDiscoverTimeout: args.brokerDiscoverTimeout});
  observer.next(Beans.get(ɵBrokerGateway).session!.clientId);

  for (let i = 1; i < args.connectCount; i++) {
    const {clientId} = await Beans.get(ɵBrokerGateway).connectToBroker();
    observer.next(clientId);
  }
}

export async function connectClientToRemoteHost(args: {symbolicName: string; brokerDiscoverTimeout: number}, observer: Observer<string>): Promise<void> {
  Beans.register(ɵWINDOW_TOP, {useValue: window}); // simulate to be loaded into the top-level window
  await MicrofrontendPlatformClient.connect(args.symbolicName, {brokerDiscoverTimeout: args.brokerDiscoverTimeout});
  observer.next(Beans.get(ɵBrokerGateway).session!.clientId);
}

/**
 * Bridges messages between host and client.
 */
export async function bridgeMessages(): Promise<void> {
  const hostWindow = window.parent;
  // @ts-expect-error custom property to retrieve the contentWindow of the iframe
  const clientWindow = window.parent.document['X-CLIENT-WINDOW'] as Window;

  // Bridge messages from the client to the remote host
  fromEvent<MessageEvent>(clientWindow, 'message') // dispatch connect message(s)
    .pipe(
      mergeWith(fromEvent<MessageEvent>(window, 'message')), // dispatch messages sent directly to the broker (host)
      filterByTransport(MessagingTransport.ClientToBroker),
    )
    .subscribe(event => {
      hostWindow.postMessage(event.data);
    });

  // Bridge messages from the remote host to the client
  fromEvent<MessageEvent>(window, 'message')
    .pipe(filterByTransport(MessagingTransport.BrokerToClient))
    .subscribe(event => {
      clientWindow.postMessage(event.data);
    });
}
