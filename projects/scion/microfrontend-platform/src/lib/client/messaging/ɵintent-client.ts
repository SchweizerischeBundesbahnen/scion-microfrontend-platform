/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
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
import {MessagingChannel} from '../../ɵmessaging.model';
import {filterByChannel, pluckMessage} from '../../operators';
import {filter} from 'rxjs/operators';
import {assertExactQualifier, QualifierMatcher} from '../../qualifier-matcher';
import {IntentClient, IntentOptions, IntentSelector} from './intent-client';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageHandler} from './message-handler';

export class ɵIntentClient implements IntentClient {

  private readonly _brokerGateway = Beans.get(BrokerGateway);

  public publish<T = any>(intent: Intent, body?: T, options?: IntentOptions): Promise<void> {
    assertExactQualifier(intent.qualifier);
    const intentMessage: IntentMessage = {
      intent,
      headers: new Map(options?.headers || []),
      capability: undefined!, /* set by the broker when dispatching the intent */
    };
    setBodyIfDefined(intentMessage, body);
    return this._brokerGateway.postMessage(MessagingChannel.Intent, intentMessage);
  }

  public request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>> {
    assertExactQualifier(intent.qualifier);
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options?.headers || []);
    return defer(() => {
      const intentMessage: IntentMessage = {
        intent,
        headers: new Map(headers) /* make a copy for each subscription to support multiple subscriptions */,
        capability: undefined!, /* set by the broker when dispatching the intent */
      };
      setBodyIfDefined(intentMessage, body);
      return this._brokerGateway.requestReply$(MessagingChannel.Intent, intentMessage).pipe(throwOnErrorStatus());
    });
  }

  public observe$<T>(selector?: IntentSelector): Observable<IntentMessage<T>> {
    return this._brokerGateway.message$
      .pipe(
        filterByChannel<IntentMessage<T>>(MessagingChannel.Intent),
        pluckMessage(),
        filter(message => !selector || !selector.type || selector.type === message.intent.type),
        filter(message => !selector || !selector.qualifier || new QualifierMatcher(selector.qualifier, {evalAsterisk: true, evalOptional: true}).matches(message.intent.qualifier)),
      );
  }

  public onIntent<IN = any, OUT = any>(selector: IntentSelector, callback: (intentMessage: IntentMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
    return new MessageHandler(Beans.get(IntentClient).observe$<IN>(selector), callback).subscription;
  }
}

function setBodyIfDefined<T>(message: TopicMessage<T> | IntentMessage<T>, body?: T): void {
  if (body !== undefined) {
    message.body = body;
  }
}
