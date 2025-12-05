/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {defer, Observable, Subscription} from 'rxjs';
import {Intent, IntentMessage, throwOnErrorStatus, TopicMessage} from '../../messaging.model';
import {BrokerGateway} from './broker-gateway';
import {IntentSubscribeCommand, MessagingChannel} from '../../ɵmessaging.model';
import {IntentClient, IntentSelector} from './intent-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageHandler} from './message-handler';
import {PublishOptions, RequestOptions} from './publish-options';

/**
 * @internal
 */
export class ɵIntentClient implements IntentClient {

  private readonly _brokerGateway = Beans.get(BrokerGateway);

  public publish<T = unknown>(intent: Intent, body?: T, options?: PublishOptions): Promise<void> {
    const intentMessage: IntentMessage = {
      intent,
      retain: options?.retain ?? false,
      headers: new Map(options?.headers),
      capability: undefined!, /* set by the broker when dispatching the intent */
      body,
    };
    return this._brokerGateway.postMessage(MessagingChannel.Intent, intentMessage);
  }

  public request$<T>(intent: Intent, body?: unknown, options?: RequestOptions): Observable<TopicMessage<T>> {
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options?.headers);
    return defer(() => {
      const intentMessage: IntentMessage = {
        intent,
        retain: options?.retain ?? false,
        headers: new Map(headers) /* make a copy for each subscription to support multiple subscriptions */,
        capability: undefined!, /* set by the broker when dispatching the intent */
        body,
      };
      return this._brokerGateway.requestReply$<T>(MessagingChannel.Intent, intentMessage).pipe(throwOnErrorStatus());
    });
  }

  public observe$<T>(selector?: IntentSelector): Observable<IntentMessage<T>> {
    return this._brokerGateway.subscribe$({
      messageChannel: MessagingChannel.Intent,
      subscribeChannel: MessagingChannel.IntentSubscribe,
      unsubscribeChannel: MessagingChannel.IntentUnsubscribe,
      newSubscribeCommand: (subscriberId: string): IntentSubscribeCommand => ({selector, subscriberId, headers: new Map()}),
    });
  }

  public onIntent<IN = unknown, OUT = unknown>(selector: IntentSelector, callback: (intentMessage: IntentMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
    return new MessageHandler(Beans.get(IntentClient).observe$<IN>(selector), callback).subscription;
  }
}
