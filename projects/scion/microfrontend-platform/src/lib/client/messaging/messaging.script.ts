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
import {filterByChannel, filterByOrigin, filterByTransport, filterByWindow} from '../../operators';
import {MessagingChannel, MessagingTransport} from '../../ɵmessaging.model';
import {ɵBrokerGateway} from './broker-gateway';
import {map} from 'rxjs/operators';
import {Intent, IntentMessage, TopicMessage} from '../../messaging.model';
import {MicrofrontendPlatformClient} from '../microfrontend-platform-client';
import {PublishOptions, RequestOptions} from '@scion/microfrontend-platform';

export async function connectToHost(args: {symbolicName: string}): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
}

export async function sendMessageWhenPlatformStateStopping(args: {symbolicName: string}): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  MicrofrontendPlatform.whenState(PlatformState.Stopping).then(async () => {
    await Beans.get(MessageClient).publish(`${args.symbolicName}/whenPlatformStateStopping`, 'message from client');
  });
}

export async function sendMessageOnBeanPreDestroy(args: {symbolicName: string}): Promise<void> {
  class LifecycleHook implements PreDestroy {
    public preDestroy(): void {
      Beans.get(MessageClient).publish(`${args.symbolicName}/beanPreDestroy`, 'message from client');
    }
  }

  Beans.register(LifecycleHook, {eager: true});
  await MicrofrontendPlatformClient.connect(args.symbolicName);
}

export async function sendMessageInBeforeUnload(args: {symbolicName: string}): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  fromEvent(window, 'beforeunload', {once: true}).subscribe(() => {
    Beans.get(MessageClient).publish(`${args.symbolicName}/beforeunload`, 'message from client');
  });
}

export async function sendMessageInUnload(args: {symbolicName: string}): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  fromEvent(window, 'unload', {once: true}).subscribe(() => {
    Beans.get(MessageClient).publish(`${args.symbolicName}/unload`, 'message from client');
  });
}

export async function subscribeToTopic(args: {symbolicName: string; topic: string; monitorTopicMessageChannel?: boolean}, observer: Observer<TopicMessage>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);

  if (args.monitorTopicMessageChannel) {
    Beans.get(MessageClient).observe$(args.topic).subscribe();

    const session = Beans.get(ɵBrokerGateway).session!;
    fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByWindow(session.broker.window),
        filterByOrigin(session.broker.origin),
        filterByTransport(MessagingTransport.BrokerToClient),
        filterByChannel<TopicMessage>(MessagingChannel.Topic),
        map(envelope => envelope.data.message),
      )
      .subscribe(observer);
  }
  else {
    Beans.get(MessageClient).observe$(args.topic).subscribe(observer);
  }
}

export async function publishIntent(args: {symbolicName: string; intent: Intent; body: unknown; options: PublishOptions}): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  await Beans.get(IntentClient).publish(args.intent, args.body, args.options);
}

export async function requestViaIntent(args: {symbolicName: string; intent: Intent; body: unknown; options: RequestOptions}, observer: Observer<TopicMessage>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);
  Beans.get(IntentClient).request$(args.intent, args.body, args.options).subscribe(observer);
}

export async function monitorTopicMessageChannel(args: {symbolicName: string}, observer: Observer<TopicMessage>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);

  const session = Beans.get(ɵBrokerGateway).session!;
  fromEvent<MessageEvent>(window, 'message')
    .pipe(
      filterByWindow(session.broker.window),
      filterByOrigin(session.broker.origin),
      filterByTransport(MessagingTransport.BrokerToClient),
      filterByChannel<TopicMessage>(MessagingChannel.Topic),
      map(envelope => envelope.data.message),
    )
    .subscribe(observer);
}

export async function subscribeToIntent(args: {symbolicName: string; intent: Intent; monitorIntentMessageChannel?: boolean}, observer: Observer<IntentMessage>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);

  if (args.monitorIntentMessageChannel) {
    Beans.get(IntentClient).observe$(args.intent).subscribe();

    const session = Beans.get(ɵBrokerGateway).session!;
    fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filterByWindow(session.broker.window),
        filterByOrigin(session.broker.origin),
        filterByTransport(MessagingTransport.BrokerToClient),
        filterByChannel<IntentMessage>(MessagingChannel.Intent),
        map(envelope => envelope.data.message),
      )
      .subscribe(observer);
  }
  else {
    Beans.get(IntentClient).observe$(args.intent).subscribe(observer);
  }
}

export async function monitorIntentMessageChannel(args: {symbolicName: string}, observer: Observer<IntentMessage>): Promise<void> {
  await MicrofrontendPlatformClient.connect(args.symbolicName);

  const session = Beans.get(ɵBrokerGateway).session!;
  fromEvent<MessageEvent>(window, 'message')
    .pipe(
      filterByWindow(session.broker.window),
      filterByOrigin(session.broker.origin),
      filterByTransport(MessagingTransport.BrokerToClient),
      filterByChannel<IntentMessage>(MessagingChannel.Intent),
      map(envelope => envelope.data.message),
    )
    .subscribe(observer);
}
