/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {interval, retry, Subscription, switchMap, timeout} from 'rxjs';
import {APP_IDENTITY, ɵVERSION} from '../../platform.model';
import {semver} from '../semver';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from '../../client/messaging/message-client';
import {PlatformTopics} from '../../ɵmessaging.model';
import {Logger, LoggingContext} from '../../logger';
import {ClientRegistry} from './client.registry';
import {CLIENT_PING_INTERVAL, CLIENT_PING_TIMEOUT} from './client.constants';
import {Client} from './client';
import {ɵApplication} from '../application-registry';
import {IntentSubscription, IntentSubscriptionRegistry} from '../message-broker/intent-subscription.registry';
import {UUID} from '@scion/toolkit/uuid';

export class ɵClient implements Client {

  public readonly version: string;
  public readonly deprecations: {legacyIntentSubscriptionApi: boolean; legacyRequestResponseSubscriptionApi: boolean};
  private _livenessDetector: Subscription | undefined;

  constructor(public readonly id: string,
              public readonly window: Window,
              public readonly application: ɵApplication,
              version: string) {
    this.version = version ?? '0.0.0';
    this.installLivenessDetector();
    this.deprecations = {
      legacyIntentSubscriptionApi: semver.lt(this.version, '1.0.0-rc.8'),
      legacyRequestResponseSubscriptionApi: semver.lt(this.version, '1.0.0-rc.9'),
    };
    if (this.deprecations.legacyIntentSubscriptionApi) {
      this.installLegacyClientIntentSubscription();
      Beans.get(Logger).warn(`[DEPRECATION][FE93C94] Application "${application.symbolicName}" is using a legacy protocol for subscribing to intents. Please update @scion/microfrontend-platform to version '${Beans.get(ɵVERSION)}'.`, new LoggingContext(application.symbolicName, this.version));
    }
    if (this.deprecations.legacyRequestResponseSubscriptionApi) {
      Beans.get(Logger).warn(`[DEPRECATION][F6DC38E] Application "${application.symbolicName}" is using a legacy request-response communication protocol. Please update @scion/microfrontend-platform to version '${Beans.get(ɵVERSION)}'.`, new LoggingContext(application.symbolicName, this.version));
    }
  }

  /**
   * Starts performing liveness tests to detect when this client is no longer connected to the host.
   *
   * Liveness is detected by sending ping requests at regular intervals.
   *
   * A client may fail to disconnect from the broker for a number of reasons:
   * - The client was disposed without notice, i.e., without receiving the browser's "unload" event.
   * - The browser discarded the "DISCONNECT" message because the client window became stale.
   *   Typically, the browser discards messages for windows that are already closed or if another page
   *   has been loaded into the window, both indicating a high load on the client during unloading.
   */
  private installLivenessDetector(): void {
    // The host app client does not reply to pings.
    if (this.application.symbolicName === Beans.get(APP_IDENTITY)) {
      return;
    }

    // Only clients of version 1.0.0-rc.11 or greater reply to pings.
    if (semver.lt(this.version, '1.0.0-rc.11')) {
      Beans.get(Logger).warn(`[VersionMismatch] Since '@scion/microfrontend-platform@1.0.0-rc.11', connected clients must reply to pings to indicate liveness. Please upgrade @scion/microfrontend-platform of application '${this.application.symbolicName}' from version '${this.version}' to version '${Beans.get(ɵVERSION)}'.`, new LoggingContext(this.application.symbolicName, this.version));
    }

    // Observable to perform the ping. If the client does not respond, we ping the client again to account for the rare situation where
    // the computer goes into standby immediately after sending the ping. Upon resumption, the timeout would expire immediately without
    // the client being able to send the response.
    const performPing$ = Beans.get(MessageClient).request$(PlatformTopics.ping(this.id))
      .pipe(timeout(Beans.get<number>(CLIENT_PING_TIMEOUT)), retry(1));

    this._livenessDetector = interval(Beans.get<number>(CLIENT_PING_INTERVAL))
      .pipe(switchMap(() => performPing$))
      .subscribe({
        error: () => {
          this.logStaleClientWarning();
          Beans.get(ClientRegistry).unregisterClient(this);
        },
      });
  }

  public get stale(): boolean {
    return window.closed;
  }

  public dispose(): void {
    this._livenessDetector?.unsubscribe();
  }

  private logStaleClientWarning(): void {
    Beans.get(Logger).warn(
      `[StaleClient] Stale client registration of application '${this.application.symbolicName}' detected.
       Removing stale registration. Most likely, the client could not disconnect from the broker, for example, because the client was
       disposed without notice, i.e., without receiving the browser's "unload" event, or because the browser discarded the 'DISCONNECT'
       message. Typically, the browser discards messages for windows that are already closed or if another page has been loaded into the
       window, both indicating a high load on the client during unloading.`.replace(/\s+/g, ' '),
      new LoggingContext(this.application.symbolicName, this.version),
    );
  }

  /**
   * Installs legacy intent subscription support for clients older than version 1.0.0-rc.8.
   */
  private installLegacyClientIntentSubscription(): void {
    const legacyClientSubscription = new IntentSubscription({}, UUID.randomUUID(), this);
    Beans.get(IntentSubscriptionRegistry).register(legacyClientSubscription);
  }
}
