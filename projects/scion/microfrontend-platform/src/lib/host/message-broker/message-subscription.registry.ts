/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Client} from '../client-registry/client';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {ClientRegistry} from '../client-registry/client.registry';
import {takeUntil} from 'rxjs/operators';
import {runSafe} from '../../safe-runner';
import {Observable, Subject} from 'rxjs';
import {Arrays, Maps} from '@scion/toolkit/util';

/**
 * Central point for managing message subscriptions.
 *
 * @ignore
 */
export class MessageSubscriptionRegistry<T extends MessageSubscription = MessageSubscription> implements PreDestroy {

  private readonly _destroy$ = new Subject<void>();
  private readonly _subscriptions = new Map<string, T>();
  private readonly _subscriptionsByApp = new Map<string, T[]>();
  private readonly _subscriptionsByClient = new Map<string, T[]>();

  private readonly _register$ = new Subject<T>();
  private readonly _unregister$ = new Subject<void>();

  constructor() {
    Beans.get(ClientRegistry).unregister$
      .pipe(takeUntil(this._destroy$))
      .subscribe((client: Client) => runSafe(() => {
        this.unregister({clientId: client.id});
      }));
  }

  /**
   * Registers given subscription.
   */
  public register(subscription: T): void {
    this._subscriptions.set(subscription.subscriberId, subscription);
    Maps.addListValue(this._subscriptionsByApp, subscription.client.application.symbolicName, subscription);
    Maps.addListValue(this._subscriptionsByClient, subscription.client.id, subscription);
    this._register$.next(subscription);
  }

  /**
   * Unregisters matching subscriptions.
   *
   * @param filter - Control which subscriptions to remove by specifying filter criteria which are "AND"ed together.
   */
  public unregister(filter: {subscriberId?: string; clientId?: string}): void {
    this.subscriptions(filter).forEach(subscription => {
      this._subscriptions.delete(subscription.subscriberId);
      Maps.removeListValue(this._subscriptionsByApp, subscription.client.application.symbolicName, subscription);
      Maps.removeListValue(this._subscriptionsByClient, subscription.client.id, subscription);
    });
    this._unregister$.next();
  }

  /**
   * Returns subscriptions matching the passed filter.
   *
   * @param filter - Control which subscriptions to return by specifying filter criteria which are "AND"ed together.
   *                 If not specified, returns all subscriptions.
   */
  public subscriptions(filter?: {subscriberId?: string; clientId?: string; appSymbolicName?: string}): T[] {
    const filterById = filter?.subscriberId;
    const filterByClient = filter?.clientId;
    const filterByApp = filter?.appSymbolicName;

    return Arrays.intersect(
      filterById ? Arrays.coerce(this._subscriptions.get(filterById)) : undefined,
      filterByClient ? Arrays.coerce(this._subscriptionsByClient.get(filterByClient)) : undefined,
      filterByApp ? Arrays.coerce(this._subscriptionsByApp.get(filterByApp)) : undefined,
      (filterById || filterByApp || filterByClient) ? undefined : Array.from(this._subscriptions.values()),
    );
  }

  /**
   * Emits when registered a subscription via {@link MessageSubscriptionRegistry#register}.
   */
  public get register$(): Observable<T> {
    return this._register$;
  }

  /**
   * Emits when unregistered a subscription via {@link MessageSubscriptionRegistry#unregister}.
   */
  public get unregister$(): Observable<void> {
    return this._unregister$;
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Represents a subscription for a given subscriber.
 *
 * @ignore
 */
export interface MessageSubscription {
  readonly subscriberId: string;
  readonly client: Client;
}
