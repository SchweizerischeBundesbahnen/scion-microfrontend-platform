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
import {concatWith, defer, merge, mergeMap, Observable, of} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';

/**
 * Central point for managing topic subscriptions.
 *
 * @ignore
 */
export class TopicSubscriptionRegistry extends MessageSubscriptionRegistry<TopicSubscription> {

  /**
   * @inheritDoc
   */
  public override subscriptions(filter?: {subscriberId?: string; clientId?: string; appSymbolicName?: string; topic?: string}): TopicSubscription[] {
    return super.subscriptions(filter).filter(subscription => filter?.topic ? subscription.matches(filter.topic) : true);
  }

  /**
   * Allows observing the number of subscriptions on a topic. It is not allowed to use wildcards in the topic to observe.
   *
   * @param  topic - Specifies the topic to observe.
   * @return An Observable that, when subscribed, emits the current number of subscribers on it. It never completes and
   *         emits continuously when the number of subscribers changes.
   */
  public subscriptionCount$(topic: string): Observable<number> {
    if (TopicMatcher.containsWildcardSegments(topic)) {
      throw Error(`[TopicObserveError] Observing the number of subscribers is only allowed on exact topics. Exact topics must not contain wildcard segments. [topic='${topic}']`);
    }

    const subscriptions$ = defer(() => of(this.subscriptions({topic})));
    const subscriptionsChange$ = merge(this.register$, this.unregister$);

    return subscriptions$
      .pipe(
        concatWith(subscriptionsChange$.pipe(mergeMap(() => subscriptions$))),
        map(subscriptions => subscriptions.length),
        distinctUntilChanged(),
      );
  }
}

/**
 * Represents a subscription on a topic. The topic may contain wildcard segments.
 *
 * @ignore
 */
export class TopicSubscription implements MessageSubscription {

  constructor(public readonly topic: string,
              public readonly subscriberId: string,
              public readonly client: Client) {
  }

  /**
   * Tests whether the given topic matches this subscription.
   */
  public matches(topic: string): boolean {
    return new TopicMatcher(this.topic).match(topic).matches;
  }
}
