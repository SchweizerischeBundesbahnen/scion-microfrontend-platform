/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MessageClient} from './client/messaging/message-client';
import {PlatformTopics} from './ɵmessaging.model';
import {map} from 'rxjs/operators';
import {Dictionary, Maps} from '@scion/toolkit/util';
import {firstValueFrom} from 'rxjs';
import {mapToBody} from './messaging.model';
import {Beans, Initializer} from '@scion/toolkit/bean-manager';
import {BrokerGateway, NullBrokerGateway} from './client/messaging/broker-gateway';

/**
 * Allows looking up properties defined in the platform host.
 *
 * @category Platform
 */
export class PlatformPropertyService implements Initializer {

  private _properties = new Map<string, unknown>();

  public async init(): Promise<void> {
    const messagingDisabled = Beans.get(BrokerGateway) instanceof NullBrokerGateway;
    if (messagingDisabled) {
      return;
    }

    // Wait until obtained platform properties so that they can be accessed synchronously by the application via `PlatformPropertyService#properties`.
    const properties$ = Beans.get(MessageClient).observe$<Dictionary>(PlatformTopics.PlatformProperties);
    this._properties = await firstValueFrom(properties$.pipe(mapToBody(), map(properties => Maps.coerce(properties))));
  }

  /**
   * Indicates whether a property with the specified key exists or not.
   */
  public contains(key: string): boolean {
    return this._properties.has(key);
  }

  /**
   * Returns the property of the given key, or `defaultValue` if the property does not exist.
   *
   * Throws an error if `defaultValue` is not specified and the property does not exist.
   */
  public get<T>(key: string, defaultValue?: T): T {
    if (this._properties.has(key)) {
      return this._properties.get(key) as T;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw Error(`[PropertyNotFoundError] No property of given name found [prop=${key}]`);
  }

  /**
   * Returns the properties map.
   */
  public properties(): Map<string, unknown> {
    return this._properties;
  }
}
