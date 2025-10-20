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
import {APP_IDENTITY} from '../../platform.model';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from '../../client/messaging/message-client';
import {PlatformTopics} from '../../ɵmessaging.model';
import {Logger, LoggingContext} from '../../logger';
import {ClientRegistry} from './client.registry';
import {Client, CLIENT_PING_INTERVAL, CLIENT_PING_TIMEOUT} from './client';
import {ɵApplication} from '../../ɵplatform.model';

/**
 * @internal
 */
export class ɵClient implements Client {

  public readonly version: string;
  private _livenessDetector: Subscription | undefined;

  constructor(public readonly id: string,
              public readonly window: Window,
              public readonly origin: string,
              public readonly application: ɵApplication,
              version?: string) {
    this.version = version ?? '0.0.0';
    this.installLivenessDetector();
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
    // The client of the host app needs not to be checked for liveness as it is part of the host.
    if (this.application.symbolicName === Beans.get(APP_IDENTITY)) {
      return;
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
    return this.window.closed;
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
}
