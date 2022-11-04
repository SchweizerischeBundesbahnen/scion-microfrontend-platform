/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Client} from '../client-registry/client';
import {MessageSubscription, MessageSubscriptionRegistry} from './message-subscription.registry';
import {Intent} from '../../messaging.model';
import {IntentSelector} from '../../client/messaging/intent-client';
import {QualifierMatcher} from '../../qualifier-matcher';

/**
 * Central point for managing intent subscriptions.
 *
 * @ignore
 */
export class IntentSubscriptionRegistry extends MessageSubscriptionRegistry<IntentSubscription> {

  public override subscriptions(filter?: {subscriberId?: string; clientId?: string; appSymbolicName?: string; intent?: Intent}): IntentSubscription[] {
    return super.subscriptions(filter).filter(subscription => filter?.intent ? subscription.matches(filter.intent) : true);
  }
}

/**
 * Represents a subscription for intents matching the passed selector.
 *
 * @ignore
 */
export class IntentSubscription extends MessageSubscription {

  constructor(public readonly selector: IntentSelector, subscriberId: string, client: Client) {
    super(subscriberId, client);
  }

  /**
   * Tests whether the given intent matches this subscription.
   *
   * Note that only a type and qualifier check is performed, but not whether the application is eligible
   * to receive matching intents, i.e., provides a fulfilling capability.
   */
  public matches(intent: Intent): boolean {
    if (this.selector.type && this.selector.type !== intent.type) {
      return false;
    }
    if (this.selector.qualifier && !new QualifierMatcher(this.selector.qualifier).matches(intent.qualifier)) {
      return false;
    }
    return true;
  }
}
