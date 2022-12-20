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
import {MicrofrontendPlatformHost} from '../../host/microfrontend-platform-host';
import {Beans} from '@scion/toolkit/bean-manager';
import {TopicMessage} from '../../messaging.model';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {BrokerGateway, SubscriptionDescriptor} from './broker-gateway';
import {IntentSubscribeCommand, MessagingChannel, TopicSubscribeCommand} from '../../ɵmessaging.model';

describe('BrokerGateway', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should not complete `requestReply$` Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    const message: TopicMessage = {topic: 'topic', headers: new Map()};
    Beans.get(BrokerGateway).requestReply$(MessagingChannel.Topic, message).subscribe(captor);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).toBeFalse();
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.getValues()).toEqual([]);
  });

  it('should not complete `subscribeToTopic$` Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    const descriptor: SubscriptionDescriptor = {
      messageChannel: MessagingChannel.Topic,
      subscribeChannel: MessagingChannel.TopicSubscribe,
      unsubscribeChannel: MessagingChannel.TopicUnsubscribe,
      newSubscribeCommand: (subscriberId: string): TopicSubscribeCommand => ({topic: 'topic', subscriberId, headers: new Map()}),
    };
    Beans.get(BrokerGateway).subscribe$(descriptor).subscribe(captor);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).toBeFalse();
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.getValues()).toEqual([]);
  });

  it('should not complete `subscribeToIntent$` Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    const descriptor: SubscriptionDescriptor = {
      messageChannel: MessagingChannel.Intent,
      subscribeChannel: MessagingChannel.IntentSubscribe,
      unsubscribeChannel: MessagingChannel.IntentUnsubscribe,
      newSubscribeCommand: (subscriberId: string): IntentSubscribeCommand => ({subscriberId, headers: new Map()}),
    };
    Beans.get(BrokerGateway).subscribe$(descriptor).subscribe(captor);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).toBeFalse();
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.getValues()).toEqual([]);
  });
});
