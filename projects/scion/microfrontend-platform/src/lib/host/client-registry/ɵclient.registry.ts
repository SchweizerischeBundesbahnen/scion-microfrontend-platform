/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {PreDestroy} from '@scion/toolkit/bean-manager';
import {Subject} from 'rxjs';
import {Client} from './client';
import {ClientRegistry} from './client.registry';

/**
 * @internal
 */
export class ɵClientRegistry implements ClientRegistry, PreDestroy {

  private readonly _clientsById = new Map<string, Client>();
  private readonly _clientsByWindow = new Map<Window, Client>();
  public readonly register$ = new Subject<Client>();
  public readonly unregister$ = new Subject<Client>();

  public registerClient(client: Client): void {
    this._clientsById.set(client.id, client);
    this._clientsByWindow.set(client.window, client);
    this.register$.next(client);
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
