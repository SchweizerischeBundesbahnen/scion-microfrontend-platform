/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {TopicSubscriptionRegistry} from './topic-subscription.registry';
import {ClientRegistry} from '../client-registry/client.registry';
import {expectEmissions} from '../../testing/spec.util.spec';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {Application} from '../../platform.model';
import {Client} from '../client-registry/client';
import {ɵClient} from '../client-registry/ɵclient';
import {VERSION} from '../../version';
import {firstValueFrom} from 'rxjs';

describe('TopicSubscriptionRegistry', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should allow multiple subscriptions on the same topic from different clients', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient('client#1');
    const client2 = newClient('client#2');
    const client3 = newClient('client#3');
    const subscriptionCountCaptor = new ObserveCaptor();
    subscriptionRegistry.subscriptionCount$('myhome/livingroom/temperature').subscribe(subscriptionCountCaptor);

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client1, 'subscriber#1');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client2, 'subscriber#2');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client3, 'subscriber#3');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(3);

    subscriptionRegistry.unsubscribe('subscriber#1');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    subscriptionRegistry.unsubscribe('subscriber#2');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    subscriptionRegistry.unsubscribe('subscriber#3');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    await expectEmissions(subscriptionCountCaptor).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });

  it('should allow multiple subscriptions on the same topic from the same client', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    const client = newClient('client');
    const subscriptionCountCaptor = new ObserveCaptor();
    subscriptionRegistry.subscriptionCount$('myhome/livingroom/temperature').subscribe(subscriptionCountCaptor);

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client, 'subscriber#1');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client, 'subscriber#2');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client, 'subscriber#3');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(3);

    subscriptionRegistry.unsubscribe('subscriber#1');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    subscriptionRegistry.unsubscribe('subscriber#2');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    subscriptionRegistry.unsubscribe('subscriber#3');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    await expectEmissions(subscriptionCountCaptor).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });

  it('should ignore an unsubscribe attempt if there is no subscription for it', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    subscriptionRegistry.unsubscribe('does-not-exist');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
  });

  it('should throw if trying to observe a non-exact topic', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    await expect(() => subscriptionRegistry.subscriptionCount$('myhome/livingroom/:measurement')).toThrowError(/TopicObserveError/);
  });

  it('should allow multiple subscriptions on different topics from the same client', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    const client = newClient('client');

    const temperatureSubscriptionCountCaptor = new ObserveCaptor();
    subscriptionRegistry.subscriptionCount$('myhome/livingroom/temperature').subscribe(temperatureSubscriptionCountCaptor);

    const humiditySubscriptionCountCaptor = new ObserveCaptor();
    subscriptionRegistry.subscriptionCount$('myhome/livingroom/humidity').subscribe(humiditySubscriptionCountCaptor);

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(0);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client, 'subscriber#1');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(0);

    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client, 'subscriber#2');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(1);

    subscriptionRegistry.subscribe('myhome/livingroom/humidity', client, 'subscriber#3');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(2);

    subscriptionRegistry.unsubscribe('subscriber#2');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(1);

    subscriptionRegistry.unsubscribe('subscriber#1');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(1);

    subscriptionRegistry.unsubscribe('subscriber#3');
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(0);

    await expectEmissions(temperatureSubscriptionCountCaptor).toEqual([0, 1, 2, 1, 0]);
    await expectEmissions(humiditySubscriptionCountCaptor).toEqual([0, 1, 2, 1, 0]);
  });

  it('should count wildcard subscriptions when observing the subscriber count on a topic', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient('client#1');
    const client2 = newClient('client#2');

    subscriptionRegistry.subscribe('myhome/:room/temperature', client1, 'subscriber#1');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(1);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    subscriptionRegistry.subscribe('myhome/:room/temperature', client1, 'subscriber#2');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(2);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    subscriptionRegistry.subscribe('myhome/:room/temperature', client2, 'subscriber#3');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(3);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(3);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    subscriptionRegistry.subscribe('myhome/:room/temperature', client2, 'subscriber#4');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(4);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(4);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    subscriptionRegistry.subscribe('myhome/:room/:measurement', client1, 'subscriber#5');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(5);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(5);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    subscriptionRegistry.subscribe('myhome/:room/:measurement', client2, 'subscriber#6');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(6);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(6);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    subscriptionRegistry.subscribe('myhome/:room/:measurement/:unit', client1, 'subscriber#7');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(6);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(1);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(6);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(1);

    subscriptionRegistry.subscribe('myhome/:room/:measurement/:unit', client2, 'subscriber#8');
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(6);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(2);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(6);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(2);
  });

  it('should remove all subscriptions of a client', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);

    const clientRegistry = Beans.get(ClientRegistry);
    const client1 = newClient('client#1');
    const client2 = newClient('client#2');
    clientRegistry.registerClient(client1);
    clientRegistry.registerClient(client2);

    const subscriptionCountCaptor = new ObserveCaptor();
    subscriptionRegistry.subscriptionCount$('myhome/livingroom/temperature').subscribe(subscriptionCountCaptor);

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client1, 'subscriber#1');
    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client1, 'subscriber#2');
    subscriptionRegistry.subscribe('myhome/:livingroom/:measurement', client1, 'subscriber#3');
    subscriptionRegistry.subscribe(':building/:livingroom/:measurement', client1, 'subscriber#4');

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client2, 'subscriber#5');
    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client2, 'subscriber#6');
    subscriptionRegistry.subscribe('myhome/:livingroom/:measurement', client2, 'subscriber#7');
    subscriptionRegistry.subscribe(':building/:livingroom/:measurement', client2, 'subscriber#8');

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(8);

    clientRegistry.unregisterClient(client1);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(4);

    clientRegistry.unregisterClient(client2);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    await expectEmissions(subscriptionCountCaptor).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 4, 0]);
  });

  it('should resolve subscribers which observe the topic \'myhome/livingroom/temperature\'', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient('client#1');
    const client2 = newClient('client#2');

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client1, 'client#1;sub#1');
    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client1, 'client#1;sub#2');
    subscriptionRegistry.subscribe('myhome/kitchen/:measurement', client1, 'client#1;sub#3');
    subscriptionRegistry.subscribe('myhome/:room/temperature', client1, 'client#1;sub#4');
    subscriptionRegistry.subscribe('myhome/:room/:measurement', client1, 'client#1;sub#5');
    subscriptionRegistry.subscribe(':building/kitchen/:measurement', client1, 'client#1;sub#6');

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client2, 'client#2;sub#1');
    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client2, 'client#2;sub#2');
    subscriptionRegistry.subscribe('myhome/kitchen/:measurement', client2, 'client#2;sub#3');
    subscriptionRegistry.subscribe('myhome/:room/temperature', client2, 'client#2;sub#4');
    subscriptionRegistry.subscribe('myhome/:room/:measurement', client2, 'client#2;sub#5');
    subscriptionRegistry.subscribe(':building/kitchen/:measurement', client2, 'client#2;sub#6');

    // Resolve the subscribers which observe the topic 'myhome/livingroom/temperature'.
    const destinations = subscriptionRegistry.resolveTopicDestinations('myhome/livingroom/temperature');

    expect(destinations.map(destination => destination.subscription.subscriberId)).toEqual([
      'client#1;sub#1',
      'client#1;sub#2',
      'client#1;sub#4',
      'client#1;sub#5',
      'client#2;sub#1',
      'client#2;sub#2',
      'client#2;sub#4',
      'client#2;sub#5',
    ]);

    expect(destinations[0]).withContext('(a)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map(),
      subscription: {
        subscriberId: 'client#1;sub#1',
        topic: 'myhome/livingroom/temperature',
        client: client1,
      },
    });
    expect(destinations[1]).withContext('(b)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map().set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#1;sub#2',
        topic: 'myhome/livingroom/:measurement',
        client: client1,
      },
    });
    expect(destinations[2]).withContext('(c)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map().set('room', 'livingroom'),
      subscription: {
        subscriberId: 'client#1;sub#4',
        topic: 'myhome/:room/temperature',
        client: client1,
      },
    });
    expect(destinations[3]).withContext('(d)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map().set('room', 'livingroom').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#1;sub#5',
        topic: 'myhome/:room/:measurement',
        client: client1,
      },
    });
    expect(destinations[4]).withContext('(e)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map(),
      subscription: {
        subscriberId: 'client#2;sub#1',
        topic: 'myhome/livingroom/temperature',
        client: client2,
      },
    });
    expect(destinations[5]).withContext('(f)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map().set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#2;sub#2',
        topic: 'myhome/livingroom/:measurement',
        client: client2,
      },
    });
    expect(destinations[6]).withContext('(g)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map().set('room', 'livingroom'),
      subscription: {
        subscriberId: 'client#2;sub#4',
        topic: 'myhome/:room/temperature',
        client: client2,
      },
    });
    expect(destinations[7]).withContext('(h)').toEqual({
      topic: 'myhome/livingroom/temperature',
      params: new Map().set('room', 'livingroom').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#2;sub#5',
        topic: 'myhome/:room/:measurement',
        client: client2,
      },
    });
  });

  it('should resolve subscribers which observe the topic \'myhome/kitchen/temperature\'', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const subscriptionRegistry = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient('client#1');
    const client2 = newClient('client#2');

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client1, 'client#1;sub#1');
    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client1, 'client#1;sub#2');
    subscriptionRegistry.subscribe('myhome/kitchen/:measurement', client1, 'client#1;sub#3');
    subscriptionRegistry.subscribe('myhome/:room/temperature', client1, 'client#1;sub#4');
    subscriptionRegistry.subscribe('myhome/:room/:measurement', client1, 'client#1;sub#5');
    subscriptionRegistry.subscribe(':building/kitchen/:measurement', client1, 'client#1;sub#6');
    subscriptionRegistry.subscribe(':building/:room/:measurement', client1, 'client#1;sub#7');

    subscriptionRegistry.subscribe('myhome/livingroom/temperature', client2, 'client#2;sub#1');
    subscriptionRegistry.subscribe('myhome/livingroom/:measurement', client2, 'client#2;sub#2');
    subscriptionRegistry.subscribe('myhome/kitchen/:measurement', client2, 'client#2;sub#3');
    subscriptionRegistry.subscribe('myhome/:room/temperature', client2, 'client#2;sub#4');
    subscriptionRegistry.subscribe('myhome/:room/:measurement', client2, 'client#2;sub#5');
    subscriptionRegistry.subscribe(':building/kitchen/:measurement', client2, 'client#2;sub#6');
    subscriptionRegistry.subscribe(':building/:room/:measurement', client2, 'client#2;sub#7');

    // Resolve the subscribers which observe the topic 'myhome/kitchen/temperature'.
    const destinations = subscriptionRegistry.resolveTopicDestinations('myhome/kitchen/temperature');

    expect(destinations.map(destination => destination.subscription.subscriberId)).toEqual([
      'client#1;sub#3',
      'client#1;sub#4',
      'client#1;sub#5',
      'client#1;sub#6',
      'client#1;sub#7',
      'client#2;sub#3',
      'client#2;sub#4',
      'client#2;sub#5',
      'client#2;sub#6',
      'client#2;sub#7',
    ]);

    expect(destinations[0]).withContext('(client 1)(a)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#1;sub#3',
        topic: 'myhome/kitchen/:measurement',
        client: client1,
      },
    });
    expect(destinations[1]).withContext('(client 1)(b)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('room', 'kitchen'),
      subscription: {
        subscriberId: 'client#1;sub#4',
        topic: 'myhome/:room/temperature',
        client: client1,
      },
    });
    expect(destinations[2]).withContext('(client 1)(c)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('room', 'kitchen').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#1;sub#5',
        topic: 'myhome/:room/:measurement',
        client: client1,
      },
    });
    expect(destinations[3]).withContext('(client 1)(d)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('building', 'myhome').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#1;sub#6',
        topic: ':building/kitchen/:measurement',
        client: client1,
      },
    });
    expect(destinations[4]).withContext('(client 1)(e)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('building', 'myhome').set('room', 'kitchen').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#1;sub#7',
        topic: ':building/:room/:measurement',
        client: client1,
      },
    });
    expect(destinations[5]).withContext('(client 2)(a)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#2;sub#3',
        topic: 'myhome/kitchen/:measurement',
        client: client2,
      },
    });
    expect(destinations[6]).withContext('(client 2)(b)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('room', 'kitchen'),
      subscription: {
        subscriberId: 'client#2;sub#4',
        topic: 'myhome/:room/temperature',
        client: client2,
      },
    });
    expect(destinations[7]).withContext('(client 2)(c)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('room', 'kitchen').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#2;sub#5',
        topic: 'myhome/:room/:measurement',
        client: client2,
      },
    });
    expect(destinations[8]).withContext('(client 2)(d)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('building', 'myhome').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#2;sub#6',
        topic: ':building/kitchen/:measurement',
        client: client2,
      },
    });
    expect(destinations[9]).withContext('(client 2)(e)').toEqual({
      topic: 'myhome/kitchen/temperature',
      params: new Map().set('building', 'myhome').set('room', 'kitchen').set('measurement', 'temperature'),
      subscription: {
        subscriberId: 'client#2;sub#7',
        topic: ':building/:room/:measurement',
        client: client2,
      },
    });
  });

  function expectSubscriptionCount(topic: string): {toBe: (expected: number) => Promise<void>} {
    return {
      toBe: async (expected: any): Promise<void> => {
        await expect(await firstValueFrom(Beans.get(TopicSubscriptionRegistry).subscriptionCount$(topic))).withContext(`topic: ${topic}`).toBe(expected);
      },
    };
  }

  function newClient(id: string): Client {
    return new ɵClient(id, {} as Window, {symbolicName: 'app'} as Application, Beans.get(VERSION));
  }
});


