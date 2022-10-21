/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {TopicSubscription, TopicSubscriptionRegistry} from './topic-subscription.registry';
import {ClientRegistry} from '../client-registry/client.registry';
import {expectEmissions} from '../../testing/spec.util.spec';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {Beans} from '@scion/toolkit/bean-manager';
import {Application} from '../../platform.model';
import {Client} from '../client-registry/client';
import {firstValueFrom, noop} from 'rxjs';
import {ɵClientRegistry} from '../client-registry/ɵclient.registry';
import {UUID} from '@scion/toolkit/uuid';
import {Logger, NULL_LOGGER} from '../../logger';

describe('TopicSubscriptionRegistry', () => {

  beforeEach(async () => {
    Beans.destroy();
    Beans.register(TopicSubscriptionRegistry);
    Beans.register(ClientRegistry, {useClass: ɵClientRegistry});
    Beans.register(Logger, {useValue: NULL_LOGGER});
    await Beans.start();
  });

  afterEach(() => Beans.destroy());

  it('should allow multiple subscriptions on the same topic of different clients', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient({id: 'client#1'});
    const client2 = newClient({id: 'client#2'});
    const client3 = newClient({id: 'client#3'});
    const subscriptionCountCaptor = new ObserveCaptor();
    testee.subscriptionCount$('myhome/livingroom/temperature').subscribe(subscriptionCountCaptor);

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#1', client1));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#2', client2));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#3', client3));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(3);

    testee.unregister({subscriberId: 'subscriber#1'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    testee.unregister({subscriberId: 'subscriber#2'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    testee.unregister({subscriberId: 'subscriber#3'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    await expectEmissions(subscriptionCountCaptor).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });

  it('should allow multiple subscriptions on the same topic of the same client', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    const client = newClient({id: 'client'});
    const subscriptionCountCaptor = new ObserveCaptor();
    testee.subscriptionCount$('myhome/livingroom/temperature').subscribe(subscriptionCountCaptor);

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#1', client));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#2', client));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#3', client));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(3);

    testee.unregister({subscriberId: 'subscriber#1'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);

    testee.unregister({subscriberId: 'subscriber#2'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);

    testee.unregister({subscriberId: 'subscriber#3'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);

    await expectEmissions(subscriptionCountCaptor).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });

  it('should throw if trying to observe a non-exact topic', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    await expect(() => testee.subscriptionCount$('myhome/livingroom/:measurement')).toThrowError(/TopicObserveError/);
  });

  it('should allow multiple subscriptions on different topics of the same client', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    const client = newClient({id: 'client'});

    const temperatureSubscriptionCountCaptor = new ObserveCaptor();
    testee.subscriptionCount$('myhome/livingroom/temperature').subscribe(temperatureSubscriptionCountCaptor);

    const humiditySubscriptionCountCaptor = new ObserveCaptor();
    testee.subscriptionCount$('myhome/livingroom/humidity').subscribe(humiditySubscriptionCountCaptor);

    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(0);

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'subscriber#1', client));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(0);

    testee.register(new TopicSubscription('myhome/livingroom/:measurement', 'subscriber#2', client));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(1);

    testee.register(new TopicSubscription('myhome/livingroom/humidity', 'subscriber#3', client));
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(2);

    testee.unregister({subscriberId: 'subscriber#2'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(1);

    testee.unregister({subscriberId: 'subscriber#1'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(1);

    testee.unregister({subscriberId: 'subscriber#3'});
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/humidity').toBe(0);

    await expectEmissions(temperatureSubscriptionCountCaptor).toEqual([0, 1, 2, 1, 0]);
    await expectEmissions(humiditySubscriptionCountCaptor).toEqual([0, 1, 2, 1, 0]);
  });

  it('should count wildcard subscriptions when observing the subscriber count on a topic', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient({id: 'client#1'});
    const client2 = newClient({id: 'client#2'});

    testee.register(new TopicSubscription('myhome/:room/temperature', 'subscriber#1', client1));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(1);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(1);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    testee.register(new TopicSubscription('myhome/:room/temperature', 'subscriber#2', client1));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(2);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(2);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    testee.register(new TopicSubscription('myhome/:room/temperature', 'subscriber#3', client2));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(3);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(3);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    testee.register(new TopicSubscription('myhome/:room/temperature', 'subscriber#4', client2));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(4);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(4);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    testee.register(new TopicSubscription('myhome/:room/:measurement', 'subscriber#5', client1));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(5);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(5);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    testee.register(new TopicSubscription('myhome/:room/:measurement', 'subscriber#6', client2));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(6);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(0);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(6);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(0);

    testee.register(new TopicSubscription('myhome/:room/:measurement/:unit', 'subscriber#7', client1));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(6);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(1);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(6);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(1);

    testee.register(new TopicSubscription('myhome/:room/:measurement/:unit', 'subscriber#8', client2));
    await expectSubscriptionCount('myhome/livingroom').toBe(0);
    await expectSubscriptionCount('myhome/livingroom/temperature').toBe(6);
    await expectSubscriptionCount('myhome/livingroom/temperature/celcius').toBe(2);
    await expectSubscriptionCount('myhome/kitchen').toBe(0);
    await expectSubscriptionCount('myhome/kitchen/temperature').toBe(6);
    await expectSubscriptionCount('myhome/kitchen/temperature/celcius').toBe(2);
  });

  it('should find subscribers which observe the topic \'myhome/livingroom/temperature\'', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient({id: 'client#1'});
    const client2 = newClient({id: 'client#2'});

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'client#1;sub#1', client1));
    testee.register(new TopicSubscription('myhome/livingroom/:measurement', 'client#1;sub#2', client1));
    testee.register(new TopicSubscription('myhome/kitchen/:measurement', 'client#1;sub#3', client1));
    testee.register(new TopicSubscription('myhome/:room/temperature', 'client#1;sub#4', client1));
    testee.register(new TopicSubscription('myhome/:room/:measurement', 'client#1;sub#5', client1));
    testee.register(new TopicSubscription(':building/kitchen/:measurement', 'client#1;sub#6', client1));

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'client#2;sub#1', client2));
    testee.register(new TopicSubscription('myhome/livingroom/:measurement', 'client#2;sub#2', client2));
    testee.register(new TopicSubscription('myhome/kitchen/:measurement', 'client#2;sub#3', client2));
    testee.register(new TopicSubscription('myhome/:room/temperature', 'client#2;sub#4', client2));
    testee.register(new TopicSubscription('myhome/:room/:measurement', 'client#2;sub#5', client2));
    testee.register(new TopicSubscription(':building/kitchen/:measurement', 'client#2;sub#6', client2));

    // Resolve the subscribers which observe the topic 'myhome/livingroom/temperature'.
    const subscribers = testee.subscriptions({topic: 'myhome/livingroom/temperature'});
    expect(subscribers.map(subscription => subscription.subscriberId)).toEqual([
      'client#1;sub#1',
      'client#1;sub#2',
      'client#1;sub#4',
      'client#1;sub#5',
      'client#2;sub#1',
      'client#2;sub#2',
      'client#2;sub#4',
      'client#2;sub#5',
    ]);

    expect(subscribers[0]).withContext('(a)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#1',
      topic: 'myhome/livingroom/temperature',
      client: client1,
    }));
    expect(subscribers[1]).withContext('(b)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#2',
      topic: 'myhome/livingroom/:measurement',
      client: client1,
    }));
    expect(subscribers[2]).withContext('(c)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#4',
      topic: 'myhome/:room/temperature',
      client: client1,
    }));
    expect(subscribers[3]).withContext('(d)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#5',
      topic: 'myhome/:room/:measurement',
      client: client1,
    }));
    expect(subscribers[4]).withContext('(e)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#1',
      topic: 'myhome/livingroom/temperature',
      client: client2,
    }));
    expect(subscribers[5]).withContext('(f)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#2',
      topic: 'myhome/livingroom/:measurement',
      client: client2,
    }));
    expect(subscribers[6]).withContext('(g)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#4',
      topic: 'myhome/:room/temperature',
      client: client2,
    }));
    expect(subscribers[7]).withContext('(h)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#5',
      topic: 'myhome/:room/:measurement',
      client: client2,
    }));
  });

  it('should find subscribers which observe the topic \'myhome/kitchen/temperature\'', async () => {
    const testee = Beans.get(TopicSubscriptionRegistry);
    const client1 = newClient({id: 'client#1'});
    const client2 = newClient({id: 'client#2'});

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'client#1;sub#1', client1));
    testee.register(new TopicSubscription('myhome/livingroom/:measurement', 'client#1;sub#2', client1));
    testee.register(new TopicSubscription('myhome/kitchen/:measurement', 'client#1;sub#3', client1));
    testee.register(new TopicSubscription('myhome/:room/temperature', 'client#1;sub#4', client1));
    testee.register(new TopicSubscription('myhome/:room/:measurement', 'client#1;sub#5', client1));
    testee.register(new TopicSubscription(':building/kitchen/:measurement', 'client#1;sub#6', client1));
    testee.register(new TopicSubscription(':building/:room/:measurement', 'client#1;sub#7', client1));

    testee.register(new TopicSubscription('myhome/livingroom/temperature', 'client#2;sub#1', client2));
    testee.register(new TopicSubscription('myhome/livingroom/:measurement', 'client#2;sub#2', client2));
    testee.register(new TopicSubscription('myhome/kitchen/:measurement', 'client#2;sub#3', client2));
    testee.register(new TopicSubscription('myhome/:room/temperature', 'client#2;sub#4', client2));
    testee.register(new TopicSubscription('myhome/:room/:measurement', 'client#2;sub#5', client2));
    testee.register(new TopicSubscription(':building/kitchen/:measurement', 'client#2;sub#6', client2));
    testee.register(new TopicSubscription(':building/:room/:measurement', 'client#2;sub#7', client2));

    // Resolve the subscribers which observe the topic 'myhome/kitchen/temperature'.
    const subscribers = testee.subscriptions({topic: 'myhome/kitchen/temperature'});
    expect(subscribers.map(subscription => subscription.subscriberId)).toEqual([
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

    expect(subscribers[0]).withContext('(client 1)(a)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#3',
      topic: 'myhome/kitchen/:measurement',
      client: client1,
    }));
    expect(subscribers[1]).withContext('(client 1)(b)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#4',
      topic: 'myhome/:room/temperature',
      client: client1,
    }));
    expect(subscribers[2]).withContext('(client 1)(c)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#5',
      topic: 'myhome/:room/:measurement',
      client: client1,
    }));
    expect(subscribers[3]).withContext('(client 1)(d)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#6',
      topic: ':building/kitchen/:measurement',
      client: client1,
    }));
    expect(subscribers[4]).withContext('(client 1)(e)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#1;sub#7',
      topic: ':building/:room/:measurement',
      client: client1,
    }));
    expect(subscribers[5]).withContext('(client 2)(a)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#3',
      topic: 'myhome/kitchen/:measurement',
      client: client2,
    }));
    expect(subscribers[6]).withContext('(client 2)(b)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#4',
      topic: 'myhome/:room/temperature',
      client: client2,
    }));
    expect(subscribers[7]).withContext('(client 2)(c)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#5',
      topic: 'myhome/:room/:measurement',
      client: client2,
    }));
    expect(subscribers[8]).withContext('(client 2)(d)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#6',
      topic: ':building/kitchen/:measurement',
      client: client2,
    }));
    expect(subscribers[9]).withContext('(client 2)(e)').toEqual(jasmine.objectContaining({
      subscriberId: 'client#2;sub#7',
      topic: ':building/:room/:measurement',
      client: client2,
    }));
  });

  function expectSubscriptionCount(topic: string): {toBe: (expected: number) => Promise<void>} {
    return {
      toBe: async (expected: any): Promise<void> => {
        await expect(await firstValueFrom(Beans.get(TopicSubscriptionRegistry).subscriptionCount$(topic))).withContext(`topic: ${topic}`).toBe(expected);
      },
    };
  }
});

function newClient(descriptor: {id: string; appSymbolicName?: string}): Client {
  return new class implements Partial<Client> {
    public readonly application = {symbolicName: descriptor.appSymbolicName} as Application;
    public readonly id = descriptor.id ?? UUID.randomUUID();
    public readonly dispose = noop;
  } as Client;
}
