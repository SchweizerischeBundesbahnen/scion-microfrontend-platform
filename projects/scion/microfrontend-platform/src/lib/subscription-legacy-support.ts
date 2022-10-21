/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {filter, takeUntil} from 'rxjs/operators';
import {Client} from './host/client-registry/client';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {VERSION} from './version';
import {UUID} from '@scion/toolkit/uuid';
import {ClientRegistry} from './host/client-registry/client.registry';
import {IntentSubscription, IntentSubscriptionRegistry} from './host/message-broker/intent-subscription.registry';
import {MessageHeaders} from './messaging.model';
import {Logger, LoggingContext} from './logger';
import {semver} from './host/semver';
import {Subject} from 'rxjs';
import {MessageEnvelope} from './ɵmessaging.model';

const INTENT_SUBSCRIPTION_API_VERSION = '1.0.0-rc.8';

/**
 * Provides legacy subscription support for clients older than version 1.0.0-rc.8.
 *
 * @deprecated since version 1.0.0-rc.8; Legacy support will be removed in version 1.0.0.
 * @internal
 */
export class SubscriptionLegacySupport implements PreDestroy {

  private _destroy$ = new Subject<void>();

  constructor() {
    this.installLegacyClientIntentSubscription();
  }

  public setSubscriberMessageHeader(envelope: MessageEnvelope, subscriberId: string, clientVersion: string): void {
    const header = semver.lt(clientVersion, INTENT_SUBSCRIPTION_API_VERSION) ? 'ɵTOPIC_SUBSCRIBER_ID' : MessageHeaders.ɵSubscriberId;
    envelope.message.headers.set(header, subscriberId);
  }

  /**
   * Installs legacy intent subscription support for clients older than version 1.0.0-rc.8.
   */
  private installLegacyClientIntentSubscription(): void {
    Beans.get(ClientRegistry).register$
      .pipe(
        filter(client => semver.lt(client.version, INTENT_SUBSCRIPTION_API_VERSION)),
        takeUntil(this._destroy$),
      )
      .subscribe((legacyClient: Client) => {
        const legacyClientSubscription = new IntentSubscription({}, UUID.randomUUID(), legacyClient);
        Beans.get(IntentSubscriptionRegistry).register(legacyClientSubscription);
        Beans.get(Logger).warn(`[DEPRECATION][FE93C94] Application "${legacyClient.application.symbolicName}" is using a legacy protocol for subscribing to intents. Please update @scion/microfrontend-platform to version '${Beans.get(VERSION)}'.`, new LoggingContext(legacyClient.application.symbolicName, legacyClient.version));
      });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}
