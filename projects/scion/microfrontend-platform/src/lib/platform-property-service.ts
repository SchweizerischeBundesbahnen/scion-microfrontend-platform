/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { MessageClient } from './client/messaging/message-client';
import { PlatformTopics } from './ɵmessaging.model';
import { map, take, takeUntil } from 'rxjs/operators';
import { Maps } from '@scion/toolkit/util';
import { Subject } from 'rxjs';
import { mapToBody } from './messaging.model';
import { Beans, PreDestroy } from '@scion/toolkit/bean-manager';

/**
 * Allows looking up properties defined on the platform host.
 *
 * @category Platform
 */
export class PlatformPropertyService implements PreDestroy {

  private _destroy$ = new Subject<void>();
  private _properties = new Map<string, any>();
  private _whenPropertiesLoaded: Promise<void>;

  constructor() {
    this._whenPropertiesLoaded = Beans.get(MessageClient).observe$(PlatformTopics.PlatformProperties)
      .pipe(
        mapToBody(),
        map(properties => Maps.coerce(properties)),
        take(1),
        takeUntil(this._destroy$),
      )
      .toPromise()
      .then(properties => {
        this._properties = properties || new Map<string, any>();
        return Promise.resolve();
      });
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
      return this._properties.get(key);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw Error(`[PropertyNotFoundError] No property of given name found [prop=${key}]`);
  }

  /**
   * Returns the properties map.
   */
  public properties(): Map<string, any> {
    return this._properties;
  }

  /**
   * Returns a Promise that resolves when loaded the properties from the host.
   */
  public get whenPropertiesLoaded(): Promise<void> {
    return this._whenPropertiesLoaded;
  }

  /**
   * @ignore
   */
  public preDestroy(): void {
    this._destroy$.next();
  }
}
