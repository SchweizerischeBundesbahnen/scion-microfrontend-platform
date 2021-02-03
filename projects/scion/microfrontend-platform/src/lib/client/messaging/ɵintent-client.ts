/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { defer, Observable, Subscription } from 'rxjs';
import { Intent, IntentMessage, throwOnErrorStatus, TopicMessage } from '../../messaging.model';
import { Qualifier } from '../../platform.model';
import { BrokerGateway } from './broker-gateway';
import { MessagingChannel } from '../../ɵmessaging.model';
import { filterByChannel, pluckMessage } from '../../operators';
import { filter } from 'rxjs/operators';
import { matchesIntentQualifier } from '../../qualifier-tester';
import { IntentClient, IntentOptions, IntentSelector } from './intent-client';
import { Beans } from '@scion/toolkit/bean-manager';
import { MessageHandler } from './message-handler';

export class ɵIntentClient implements IntentClient { // tslint:disable-line:class-name

  constructor(private readonly _brokerGateway: BrokerGateway) {
  }

  public publish<T = any>(intent: Intent, body?: T, options?: IntentOptions): Promise<void> {
    assertIntentQualifier(intent.qualifier, {allowWildcards: false});
    const headers = new Map(options && options.headers);
    const intentMessage: IntentMessage = {intent, headers: new Map(headers)};
    setBodyIfDefined(intentMessage, body);
    return this._brokerGateway.postMessage(MessagingChannel.Intent, intentMessage);
  }

  public request$<T>(intent: Intent, body?: any, options?: IntentOptions): Observable<TopicMessage<T>> {
    assertIntentQualifier(intent.qualifier, {allowWildcards: false});
    // IMPORTANT:
    // When sending a request, the platform adds various headers to the message. Therefore, to support multiple subscriptions
    // to the returned Observable, each subscription must have its individual message instance and headers map.
    // In addition, the headers are copied to prevent modifications before the effective subscription.
    const headers = new Map(options && options.headers);
    return defer(() => {
      const intentMessage: IntentMessage = {intent, headers: new Map(headers)};
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
        filter(message => !selector || !selector.qualifier || matchesIntentQualifier(selector.qualifier, message.intent.qualifier)),
      );
  }

  public onIntent<IN = any, OUT = any>(selector: IntentSelector, callback: (intentMessage: IntentMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
    return new MessageHandler(Beans.get(IntentClient).observe$<IN>(selector), callback).subscription;
  }
}

function assertIntentQualifier(qualifier: Qualifier, options: { allowWildcards: boolean }): void {
  if (!qualifier || Object.keys(qualifier).length === 0) {
    return;
  }

  if (!options.allowWildcards && Object.entries(qualifier).some(([key, value]) => key === '*' || value === '*' || value === '?')) {
    throw Error(`[IllegalQualifierError] Qualifier must not contain wildcards. [qualifier='${JSON.stringify(qualifier)}']`);
  }
}

function setBodyIfDefined<T>(message: TopicMessage<T> | IntentMessage<T>, body?: T): void {
  if (body !== undefined) {
    message.body = body;
  }
}
