/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {Subject} from 'rxjs';
import {Client} from './client';
import {Logger, LoggingContext} from '../../logger';
import {ClientRegistry} from './client.registry';

export class ɵClientRegistry implements ClientRegistry, PreDestroy {

  private readonly _clientsById = new Map<string, Client>();
  private readonly _clientsByWindow = new Map<Window, Client>();
  public readonly unregister$ = new Subject<Client>();

  public registerClient(client: Client): void {
    const staleClient = this._clientsByWindow.get(client.window);
    if (staleClient) {
      Beans.get(Logger).warn(
        `[StaleClient] Stale client registration detected when loading application '${client.application.symbolicName}'
        into the window of '${staleClient.application.symbolicName}'. Removing stale registration. Most likely, the client could not disconnect
        from the broker, for example, because the client was disposed without notice, i.e., without receiving the browser's "unload" event, or
        because the browser discarded the 'DISCONNECT' message, maybe due to a high load on the client during unloading.`.replace(/\s+/g, ' '),
        new LoggingContext(staleClient.application.symbolicName, staleClient.version),
      );
      this.unregisterClient(staleClient);
    }
    this._clientsById.set(client.id, client);
    this._clientsByWindow.set(client.window, client);
  }

  public unregisterClient(client: Client): void {
    this._clientsById.delete(client.id);
    this._clientsByWindow.delete(client.window);
    this.unregister$.next(client);
    client.dispose();
  }

  public getByClientId(clientId: string): Client | undefined {
    return this._clientsById.get(clientId);
  }

  public getByWindow(window: Window): Client | undefined {
    return this._clientsByWindow.get(window);
  }

  public getByApplication(appSymbolicName: string): Client[] {
    return Array.from(this._clientsById.values()).filter(client => client.application.symbolicName === appSymbolicName);
  }

  public preDestroy(): void {
    this._clientsById.forEach(client => this.unregisterClient(client));
  }
}
