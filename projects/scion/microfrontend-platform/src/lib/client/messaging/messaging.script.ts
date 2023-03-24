/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
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
import {IntentClient} from './intent-client';
import {fromEvent, Observer} from 'rxjs';
import {filterByChannel} from '../../operators';
import {MessagingChannel} from '../../ɵmessaging.model';
import {ɵBrokerGateway} from './broker-gateway';
import {map} from 'rxjs/operators';
import {IntentMessage, TopicMessage} from '../../messaging.model';
import {MicrofrontendPlatformClient} from '../microfrontend-platform-client';

export async function connectToHost({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);
}

export async function sendMessageWhenPlatformStateStopping({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);
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
  await MicrofrontendPlatformClient.connect(symbolicName);
}

export async function sendMessageInBeforeUnload({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);
  fromEvent(window, 'beforeunload', {once: true}).subscribe(() => {
    Beans.get(MessageClient).publish(`${symbolicName}/beforeunload`, 'message from client');
  });
}

export async function sendMessageInUnload({symbolicName}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);
  fromEvent(window, 'unload', {once: true}).subscribe(() => {
    Beans.get(MessageClient).publish(`${symbolicName}/unload`, 'message from client');
  });
}

export async function subscribeToTopic({symbolicName, topic, monitorTopicMessageChannel}, observer: Observer<TopicMessage>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);

  // TODO [MessageChannel]: I think we do not need this anymore. It was to test that we did not receive messages from other app subscriptions.
  if (monitorTopicMessageChannel) {
    Beans.get(MessageClient).observe$(topic).subscribe();

    const session = Beans.get(ɵBrokerGateway).session;
    fromEvent<MessageEvent>(session.broker.port, 'message')
      .pipe(
        filterByChannel(MessagingChannel.Topic),
        map(envelope => envelope.data.message),
      )
      .subscribe(observer);
  }
  else {
    Beans.get(MessageClient).observe$(topic).subscribe(observer);
  }
}

export async function publishIntent({symbolicName, intent, body, options}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);
  await Beans.get(IntentClient).publish(intent, body, options);
}

export async function requestViaIntent({symbolicName, intent, body, options}, observer: Observer<TopicMessage>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);
  Beans.get(IntentClient).request$(intent, body, options).subscribe(observer);
}

export async function monitorTopicMessageChannel({symbolicName}, observer: Observer<TopicMessage>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);

  const session = Beans.get(ɵBrokerGateway).session;
  fromEvent<MessageEvent>(session.broker.port, 'message')
    .pipe(
      filterByChannel(MessagingChannel.Topic),
      map(envelope => envelope.data.message),
    )
    .subscribe(observer);
}

export async function subscribeToIntent({symbolicName, intent, monitorIntentMessageChannel}, observer: Observer<TopicMessage | IntentMessage>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);

  // TODO [MessageChannel]: I think we do not need this anymore. It was to test that we did not receive messages from other app subscriptions.
  if (monitorIntentMessageChannel) {
    Beans.get(IntentClient).observe$(intent).subscribe();

    const session = Beans.get(ɵBrokerGateway).session;
    fromEvent<MessageEvent>(session.broker.port, 'message')
      .pipe(
        filterByChannel(MessagingChannel.Intent),
        map(envelope => envelope.data.message),
      )
      .subscribe(observer);
  }
  else {
    Beans.get(IntentClient).observe$(intent).subscribe(observer);
  }
}

export async function monitorIntentMessageChannel({symbolicName}, observer: Observer<TopicMessage>): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatformClient.connect(symbolicName);

  const session = Beans.get(ɵBrokerGateway).session;
  fromEvent<MessageEvent>(session.broker.port, 'message')
    .pipe(
      filterByChannel(MessagingChannel.Intent),
      map(envelope => envelope.data.message),
    )
    .subscribe(observer);
}
