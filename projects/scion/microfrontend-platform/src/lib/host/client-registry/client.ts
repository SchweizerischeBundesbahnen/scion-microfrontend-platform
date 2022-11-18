/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ɵApplication} from '../application-registry';

/**
 * Represents a client which is connected to the message broker.
 *
 * @ignore
 */
export interface Client {

  /**
   * Unique identity of this client.
   */
  readonly id: string;

  /**
   * The window this client is loaded into.
   */
  readonly window: Window;

  /**
   * The application this client belongs to.
   */
  readonly application: ɵApplication;

  /**
   * The version of the @scion/microfrontend-platform installed on the client.
   */
  readonly version: string;

  /**
   * Indicates whether this client is stale and no more messages can be transported to this client.
   */
  readonly stale: boolean;

  /**
   * Deprecated APIs used by the client.
   */
  readonly deprecations: {
    /**
     * @deprecated since version 1.0.0-rc.8; Legacy support will be removed in version 1.0.0.
     */
    legacyIntentSubscriptionApi: boolean;
    /**
     * @deprecated since version 1.0.0-rc.9; Legacy support will be removed in version 1.0.0.
     */
    legacyRequestResponseSubscriptionApi: boolean;
  };

  /**
   * Releases resources allocated by this client.
   */
  dispose(): void;
}
