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
import {MessageClient} from './messaging/message-client';
import {Observer} from 'rxjs';
import {UUID} from '@scion/toolkit/uuid';
import {map, take} from 'rxjs/operators';
import {MessageHeaders} from '../messaging.model';
import {MicrofrontendPlatformStopper} from '../microfrontend-platform-stopper';
import {VERSION} from '../version';

export async function connectToHost({symbolicName, disconnectOnUnloadDisabled = false, version = undefined}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  if (disconnectOnUnloadDisabled) {
    Beans.register(MicrofrontendPlatformStopper, {useClass: NullMicrofrontendPlatformStopper});
  }
  if (version) {
    Beans.register(VERSION, {useValue: version});
  }
  await MicrofrontendPlatform.connectToHost(symbolicName);
  await sendCurrentClientIdToFixture(observer);
}

export async function connectToHostThenStopPlatform({symbolicName}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  await sendCurrentClientIdToFixture(observer);
  await MicrofrontendPlatform.destroy();
}

export async function connectToHostThenLocationHref({symbolicName, locationHref}, observer: Observer<string>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  await sendCurrentClientIdToFixture(observer);
  window.location.href = locationHref;
}

async function sendCurrentClientIdToFixture(observer: Observer<string>): Promise<void> {
  const uuid = UUID.randomUUID();
  const clientId = Beans.get(MessageClient).observe$(uuid)
    .pipe(
      take(1),
      map(message => message.headers.get(MessageHeaders.ClientId)),
    )
    .toPromise();
  await Beans.get(MessageClient).publish(uuid);
  observer.next(await clientId);
}

class NullMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper {
}
