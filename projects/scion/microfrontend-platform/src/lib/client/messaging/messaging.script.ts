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
import {PlatformState} from '../../platform-state';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {MessageClient} from './message-client';
import {fromEvent} from 'rxjs';

export async function connectToHost({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
}

export async function sendMessageWhenPlatformStateStopping({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  MicrofrontendPlatform.whenState(PlatformState.Stopping).then(async () => {
    await Beans.get(MessageClient).publish(`${symbolicName}/whenPlatformStateStopping`, 'message from client');
  });
}

export async function sendMessageOnBeanPreDestroy({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  class LifecycleHook implements PreDestroy {
    public preDestroy(): void {
      Beans.get(MessageClient).publish(`${symbolicName}/beanPreDestroy`, 'message from client');
    }
  }

  Beans.register(LifecycleHook, {eager: true});
  await MicrofrontendPlatform.connectToHost(symbolicName);
}

export async function sendMessageInBeforeUnload({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  fromEvent(window, 'beforeunload', {once: true}).subscribe(() => {
    Beans.get(MessageClient).publish(`${symbolicName}/beforeunload`, 'message from client');
  });
}

export async function sendMessageInUnload({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost(symbolicName);
  fromEvent(window, 'unload', {once: true}).subscribe(() => {
    Beans.get(MessageClient).publish(`${symbolicName}/unload`, 'message from client');
  });
}
