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
 * @internal
 */
export class MessageSubscriptionRegistry<T extends MessageSubscription = MessageSubscription> implements PreDestroy {

  private readonly _destroy$ = new Subject<void>();
  private readonly _subscriptions = new Map<string, T>();
  private readonly _subscriptionsByApp = new Map<string, Set<T>>();
  private readonly _subscriptionsByClient = new Map<string, Set<T>>();

  private readonly _register$ = new Subject<T>();
  private readonly _unregister$ = new Subject<T[]>();

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
    Maps.addSetValue(this._subscriptionsByApp, subscription.client.application.symbolicName, subscription);
    Maps.addSetValue(this._subscriptionsByClient, subscription.client.id, subscription);
    this.onRegister?.(subscription);
    this._register$.next(subscription);
  }

  /**
   * Unregisters matching subscriptions.
   *
   * @param filter - Control which subscriptions to remove by specifying filter criteria which are "AND"ed together.
   */
  public unregister(filter: {subscriberId?: string; clientId?: string}): void {
    const subscriptions = this.subscriptions(filter);
    subscriptions.forEach(subscription => {
      this._subscriptions.delete(subscription.subscriberId);
      Maps.removeSetValue(this._subscriptionsByApp, subscription.client.application.symbolicName, subscription);
      Maps.removeSetValue(this._subscriptionsByClient, subscription.client.id, subscription);
      this.onUnregister?.(subscription);
      subscription.notifyUnsubscribe();
    });
    this._unregister$.next(subscriptions);
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
      filterById ? this.subscriptionById(filterById) : undefined,
      filterByClient ? this.subscriptionsByClient(filterByClient) : undefined,
      filterByApp ? this.subscriptionsByApp(filterByApp) : undefined,
      (filterById || filterByApp || filterByClient) ? undefined : Array.from(this._subscriptions.values()),
    );
  }

  /**
   * Returns the subscription of given subscriber.
   */
  private subscriptionById(subscriberId: string): [T] | [] {
    const subscription = this._subscriptions.get(subscriberId);
    return subscription ? [subscription] : [];
  }

  /**
   * Returns the subscriptions of given client.
   */
  private subscriptionsByClient(clientId: string): T[] {
    const subscriptions = this._subscriptionsByClient.get(clientId);
    return subscriptions ? Array.from(subscriptions) : [];
  }

  /**
   * Returns the subscriptions of given application.
   */
  private subscriptionsByApp(appSymbolicName: string): T[] {
    const subscriptions = this._subscriptionsByApp.get(appSymbolicName);
    return subscriptions ? Array.from(subscriptions) : [];
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
  public get unregister$(): Observable<T[]> {
    return this._unregister$;
  }

  /**
   * Method invoked when registered a subscription, but before the change was emitted.
   */
  protected onRegister?(subscription: T): void;

  /**
   * Method invoked when unregistered a subscription, but before the change was emitted.
   */
  protected onUnregister?(subscription: T): void;

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Represents a subscription for a given subscriber.
 *
 * @internal
 */
export class MessageSubscription {

  /**
   * Notify when the subscriber unsubscribes.
   */
  public notifyUnsubscribe!: () => void;
  /**
   * Promise that resolves when the subscriber unsubscribes.
   */
  public readonly whenUnsubscribe = new Promise<void>(resolve => this.notifyUnsubscribe = resolve);

  constructor(public readonly subscriberId: string, public readonly client: Client) {
  }
}
