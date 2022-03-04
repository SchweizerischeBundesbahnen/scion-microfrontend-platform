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
import {TopicMessage} from '../../messaging.model';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {BrokerGateway} from './broker-gateway';
import {MessagingChannel} from '../../ɵmessaging.model';

describe('BrokerGateway', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should not complete `requestReply$` Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

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
    await MicrofrontendPlatform.startHost({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    Beans.get(BrokerGateway).subscribeToTopic$('topic').subscribe(captor);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).toBeFalse();
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.getValues()).toEqual([]);
  });
});
