/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Application} from '../../platform.model';

/**
 * Central point for managing client registrations.
 *
 * @ignore
 */
export class ClientRegistry {

  private readonly _clientsById = new Map<string, Client>();
  private readonly _clientsByWindow = new Map<Window, Client>();
  private readonly _clientsByGatewayWindow = new Map<Window, Client>();

  public registerClient(client: Client): void {
    this._clientsById.set(client.id, client);
    this._clientsByWindow.set(client.window, client);
    this._clientsByGatewayWindow.set(client.gatewayWindow, client);
  }

  public unregisterClient(client: Client): void {
    this._clientsById.delete(client.id);
    this._clientsByWindow.delete(client.window);
    this._clientsByGatewayWindow.delete(client.gatewayWindow);
  }

  public getByClientId(clientId: string): Client | undefined {
    return this._clientsById.get(clientId);
  }

  public getByWindow(window: Window): Client | undefined {
    return this._clientsByWindow.get(window);
  }

  public getByGatewayWindow(gatewayWindow: Window): Client | undefined {
    return this._clientsByGatewayWindow.get(gatewayWindow);
  }

  public getByApplication(appSymbolicName: string): Client[] {
    return Array.from(this._clientsById.values()).filter(client => client.application.symbolicName === appSymbolicName);
  }
}

/**
 * Represents a client which is connected to the message broker.
 *
 * @ignore
 */
export class Client {

  public readonly id: string;
  public readonly window: Window;
  public readonly gatewayWindow: Window;
  public readonly application: Application;

  constructor(client: Client) {
    this.id = client.id;
    this.window = client.window;
    this.gatewayWindow = client.gatewayWindow;
    this.application = client.application;
  }
}
