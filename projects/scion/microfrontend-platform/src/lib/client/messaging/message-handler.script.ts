/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from './message-client';
import {concat, NEVER, of} from 'rxjs';
import {IntentClient} from './intent-client';

export async function connectToHostThenMessageClientOnMessage({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  Beans.get(MessageClient).onMessage<void, never>('topic', () => NEVER);
}

export async function connectToHostThenIntentClientOnIntent({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  Beans.get(IntentClient).onIntent<void>({type: 'capability'}, () => concat(of('initial'), NEVER));
}
