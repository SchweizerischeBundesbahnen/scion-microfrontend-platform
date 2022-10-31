/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ClientRegistry} from '../client-registry/client.registry';
import {Beans} from '@scion/toolkit/bean-manager';
import {Client} from '../client-registry/client';
import {noop} from 'rxjs';
import {ɵClientRegistry} from '../client-registry/ɵclient.registry';
import {UUID} from '@scion/toolkit/uuid';
import {IntentSubscription, IntentSubscriptionRegistry} from './intent-subscription.registry';
import {ɵApplication} from '../application-registry';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {map} from 'rxjs/operators';

describe('IntentSubscriptionRegistry', () => {

  beforeEach(async () => {
    Beans.destroy();
    Beans.register(IntentSubscriptionRegistry);
    Beans.register(ClientRegistry, {useClass: ɵClientRegistry});
    await Beans.start();
  });

  afterEach(() => Beans.destroy());

  it('should match all subscriptions', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(1);
  });

  it('should match subscription {type: \'microfrontend\'}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({type: 'microfrontend'}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(0);
  });

  it('should match subscription {type: \'microfrontend\', qualifier: {\'*\': \'*\'}}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({type: 'microfrontend', qualifier: {'*': '*'}}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(0);
  });

  it('should match subscription {type: \'microfrontend\', qualifier: {}}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({type: 'microfrontend', qualifier: {}}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(0);
  });

  it('should match subscription {type: \'microfrontend\', qualifier: {entity: \'product\'}}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({type: 'microfrontend', qualifier: {entity: 'product'}}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(0);
  });

  it('should match subscription {qualifier: {entity: \'product\'}}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({qualifier: {entity: 'product'}}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(0);
  });

  it('should match subscription {qualifier: {entity: \'?\'}}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({qualifier: {entity: '?'}}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(1);
  });

  it('should match subscription {qualifier: {entity: \'*\'}}', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    testee.register(new IntentSubscription({qualifier: {entity: '*'}}, 'subscriber#id', newClient()));
    expect(testee.subscriptions().length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'microfrontend', qualifier: {entity: 'customer'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item'}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {}}}).length).toBe(0);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'product'}}}).length).toBe(1);
    expect(testee.subscriptions({intent: {type: 'menu-item', qualifier: {entity: 'customer'}}}).length).toBe(1);
  });

  it('should have subscription added to index when MessageSubscriptionRegistry#register$ emits', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    const existsCaptor = new ObserveCaptor();
    testee.register$
      .pipe(map(() => testee.subscriptions({intent: {type: 'microfrontend'}}).length > 0))
      .subscribe(existsCaptor);

    // WHEN registering a subscription
    testee.register(new IntentSubscription({type: 'microfrontend'}, 'subscriber', newClient()));
    // THEN expect subscription to be added when MessageSubscriptionRegistry#register$ emits
    expect(existsCaptor.getValues()).toEqual([true]);
  });

  it('should have subscription removed from index when MessageSubscriptionRegistry#unregister$ emits', () => {
    const testee = Beans.get(IntentSubscriptionRegistry);

    const existsCaptor = new ObserveCaptor();
    testee.unregister$
      .pipe(map(() => testee.subscriptions({intent: {type: 'microfrontend'}}).length > 0))
      .subscribe(existsCaptor);

    // GIVEN
    testee.register(new IntentSubscription({type: 'microfrontend'}, 'subscriber', newClient()));
    // WHEN unregistering the subscription
    testee.unregister({subscriberId: 'subscriber'});
    // THEN expect subscription to be removed when MessageSubscriptionRegistry#unregister$ emits
    expect(existsCaptor.getValues()).toEqual([false]);
  });
});

function newClient(): Client {
  return new class implements Partial<Client> {
    public readonly id = UUID.randomUUID();
    public readonly application = {symbolicName: 'app'} as ɵApplication;
    public readonly dispose = noop;
  } as Client;
}
