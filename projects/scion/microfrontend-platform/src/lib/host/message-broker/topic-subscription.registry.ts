/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TopicMatcher} from '../../topic-matcher.util';
import {Client} from '../client-registry/client';
import {MessageSubscription, MessageSubscriptionRegistry} from './message-subscription.registry';
import {filter, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Arrays, Maps} from '@scion/toolkit/util';
import {Topics} from '../../topics.util';
import {filterArray} from '@scion/toolkit/operators';

const ASTERISK = ':ɵANY';

/**
 * Central point for managing topic subscriptions.
 *
 * @ignore
 */
export class TopicSubscriptionRegistry extends MessageSubscriptionRegistry<TopicSubscription> {

  private readonly _subscriptionsByTopic = new Map<string, Set<TopicSubscription>>();

  protected override onRegister(subscription: TopicSubscription): void {
    const topic = Topics.replaceWildcardSegments(subscription.topic, ASTERISK);
    Maps.addSetValue(this._subscriptionsByTopic, topic, subscription);
  }

  protected override onUnregister(subscription: TopicSubscription): void {
    const topic = Topics.replaceWildcardSegments(subscription.topic, ASTERISK);
    Maps.removeSetValue(this._subscriptionsByTopic, topic, subscription);
  }

  public override subscriptions(filter?: {subscriberId?: string; clientId?: string; appSymbolicName?: string; topic?: string}): TopicSubscription[] {
    // Note that we need to identify matching subscriptions very quickly, otherwise the broker's throughput would decrease massively.
    // Therefore, we must never iterate over all subscriptions, but resolve subscriptions by index.
    const filterByTopic = filter?.topic;
    const filterById = filter?.subscriberId;
    const filterByClient = filter?.clientId;
    const filterByApp = filter?.appSymbolicName;

    return Arrays.intersect(
      filterByTopic ? this.subscriptionsByTopic(filterByTopic) : undefined,
      (filterById || filterByApp || filterByClient) ? super.subscriptions(filter) : undefined,
      (filterById || filterByApp || filterByClient || filterByTopic) ? undefined : super.subscriptions(),
    );
  }

  /**
   * Returns the subscription of given topic.
   */
  private subscriptionsByTopic(topic: string): TopicSubscription[] {
    const subscriptions = new Array<TopicSubscription>();
    Topics.computeWildcardSegmentPermutations(topic, ASTERISK).forEach(permutation => {
      subscriptions.push(...this._subscriptionsByTopic.get(permutation) || []);
    });
    return subscriptions;
  }

  /**
   * Allows observing the number of subscriptions on a topic. It is not allowed to use wildcards in the topic to observe.
   *
   * @param  topic - Specifies the topic to observe.
   * @return An Observable that, when subscribed, emits the current number of subscribers on it. It never completes and
   *         emits continuously when the number of subscribers changes.
   */
  public subscriptionCount$(topic: string): Observable<number> {
    if (Topics.containsWildcardSegments(topic)) {
      throw Error(`[TopicObserveError] Observing the number of subscribers is only allowed on exact topics. Exact topics must not contain wildcard segments. [topic='${topic}']`);
    }

    return new Observable(observer => {
      const unsubscribe$ = new Subject<void>();

      // Emit current subscription count.
      let count = this.subscriptions({topic}).length;
      observer.next(count);

      // Increment count when matching subscriptions are added.
      this.register$
        .pipe(
          filter(subscription => subscription.matches(topic)),
          takeUntil(unsubscribe$),
        )
        .subscribe(() => {
          count++;
          observer.next(count);
        });

      // Decrement count when matching subscriptions are removed.
      this.unregister$
        .pipe(
          filterArray(subscription => subscription.matches(topic)),
          filter(subscriptions => subscriptions.length > 0),
          takeUntil(unsubscribe$),
        )
        .subscribe(subscriptions => {
          count -= subscriptions.length;
          observer.next(count);
        });

      return (): void => unsubscribe$.next();
    });
  }
}

/**
 * Represents a subscription on a topic. The topic may contain wildcard segments.
 *
 * @ignore
 */
export class TopicSubscription extends MessageSubscription {

  constructor(public readonly topic: string, subscriberId: string, client: Client) {
    super(subscriberId, client);
  }

  /**
   * Tests whether the given topic matches this subscription.
   */
  public matches(topic: string): boolean {
    return topic === this.topic || new TopicMatcher(this.topic).match(topic).matches;
  }
}
