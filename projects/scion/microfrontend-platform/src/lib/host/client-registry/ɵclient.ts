/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Subscription, timer} from 'rxjs';
import {APP_IDENTITY, ɵVERSION} from '../../platform.model';
import {semver} from '../semver';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from '../../client/messaging/message-client';
import {PlatformTopics} from '../../ɵmessaging.model';
import {debounceTime, filter, startWith} from 'rxjs/operators';
import {MessageHeaders} from '../../messaging.model';
import {Logger, LoggingContext} from '../../logger';
import {ClientRegistry} from './client.registry';
import {CLIENT_HEARTBEAT_INTERVAL, STALE_CLIENT_UNREGISTER_DELAY} from './client.constants';
import {Client} from './client';
import {ɵApplication} from '../application-registry';

export class ɵClient implements Client {

  public readonly version: string;
  private _heartbeat: Subscription | undefined;
  private _heartbeatInterval: number;
  private _staleClientUnregisterTimer: Subscription | undefined;
  private _staleClientUnregisterDelay: number;

  constructor(public readonly id: string,
              public readonly window: Window,
              public readonly application: ɵApplication,
              version: string) {
    this.version = version ?? '0.0.0';
    this._heartbeatInterval = Beans.get(CLIENT_HEARTBEAT_INTERVAL);
    this._staleClientUnregisterDelay = Beans.get(STALE_CLIENT_UNREGISTER_DELAY);
    this.installHeartbeatMonitor();
  }

  /**
   * Monitors the heartbeat of this client to detect when this client is no longer connected to the host.
   * When not receiving any more heartbeat, this client will be marked as stale and queued for removal.
   *
   * A client may fail to disconnect from the broker for a number of reasons:
   * - The client was disposed without notice, i.e., without receiving the browser's "unload" event.
   * - The browser discarded the "DISCONNECT" message because the client window became stale.
   *   Typically, the browser discards messages for windows that are already closed or if another page
   *   has been loaded into the window, both indicating a high load on the client during unloading.
   */
  private installHeartbeatMonitor(): void {
    // The host app client does not send a heartbeat.
    if (this.application.symbolicName === Beans.get(APP_IDENTITY)) {
      return;
    }

    // Only clients of version 1.0.0-rc.1 or greater send a heartbeat.
    if (semver.lt(this.version, '1.0.0-rc.1')) {
      Beans.get(Logger).warn(`[VersionMismatch] Since '@scion/microfrontend-platform@1.0.0-rc.1', connected clients must send a heartbeat to indicate liveness. Please upgrade @scion/microfrontend-platform of application '${this.application.symbolicName}' from version '${this.version}' to version '${Beans.get(ɵVERSION)}'.`, new LoggingContext(this.application.symbolicName, this.version));
      return;
    }

    this._heartbeat = Beans.get(MessageClient).observe$(PlatformTopics.heartbeat(this.id))
      .pipe(
        filter(message => message.headers.get(MessageHeaders.ClientId) === this.id),
        startWith(undefined as void),
        debounceTime(2 * this._heartbeatInterval),
      )
      .subscribe(() => {
        this.logStaleClientWarning();
        Beans.get(ClientRegistry).unregisterClient(this);
      });
  }

  public markStaleAndQueueForRemoval(): void {
    if (this._staleClientUnregisterTimer) {
      return;
    }

    this._staleClientUnregisterTimer = timer(this._staleClientUnregisterDelay).subscribe(() => {
      this.logStaleClientWarning();
      Beans.get(ClientRegistry).unregisterClient(this);
    });
    this._heartbeat?.unsubscribe();
  }

  public get stale(): boolean {
    return !!this._staleClientUnregisterTimer || window.closed;
  }

  public dispose(): void {
    this._heartbeat?.unsubscribe();
    this._staleClientUnregisterTimer?.unsubscribe();
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
