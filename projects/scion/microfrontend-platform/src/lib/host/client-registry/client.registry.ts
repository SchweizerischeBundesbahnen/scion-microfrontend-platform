/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Observable} from 'rxjs';
import {Client} from './client';

/**
 * Central point for managing client registrations.
 *
 * @ignore
 */
export abstract class ClientRegistry {

  /**
   * Emits when unregistering a client.
   */
  public abstract readonly unregister$: Observable<Client>;

  /**
   * Registers given client.
   *
   * If another client is already registered under the same window,
   * a warning is logged and the "stale" client removed.
   */
  public abstract registerClient(client: Client): void;

  /**
   * Unregisters given client.
   */
  public abstract unregisterClient(client: Client): void;

  /**
   * Returns the client associated with the given id, or `undefined` if not found.
   */
  public abstract getByClientId(clientId: string): Client | undefined;

  /**
   * Returns the client associated with the given {@link Window}, or `undefined` if not found.
   */
  public abstract getByWindow(window: Window): Client | undefined;

  /**
   * Returns the clients associated with the given application.
   */
  public abstract getByApplication(appSymbolicName: string): Client[];
}
