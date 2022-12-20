/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ɵApplication} from '../../ɵplatform.model';

/**
 * Represents a client which is connected to the message broker.
 *
 * @internal
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
   * The origin of this client; is one of {@link ɵApplication.allowedMessageOrigins}.
   */
  readonly origin: string;

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
     * @deprecated since version 1.0.0-rc.8; Legacy support will be removed in version 2.0.0.
     */
    legacyIntentSubscriptionProtocol: boolean;
    /**
     * @deprecated since version 1.0.0-rc.9; Legacy support will be removed in version 2.0.0.
     */
    legacyRequestResponseSubscriptionProtocol: boolean;
    /**
     * @deprecated since version 1.0.0-rc.11; Legacy support will be removed in version 2.0.0.
     */
    legacyHeartbeatLivenessProtocol: boolean;
  };

  /**
   * Releases resources allocated by this client.
   */
  dispose(): void;
}

/**
 * Specifies the interval (in milliseconds) at which the host pings connected clients.
 *
 * By default, if not set, a ping interval of 60s is used.
 *
 * NOTE: Use pure inline comment to be tree shakable, i.e., to not be included in client app.
 *
 * @internal
 */
export const CLIENT_PING_INTERVAL = /*@__PURE__*/Symbol('CLIENT_PING_INTERVAL');

/**
 * Specifies the ping timeout (in milliseconds) for unregistering a client.
 *
 * By default, if not set, clients are unregistered if not answering the ping within 10 seconds.
 *
 * NOTE: Use pure inline comment to be tree shakable, i.e., to not be included in client app.
 *
 * @internal
 */
export const CLIENT_PING_TIMEOUT = /*@__PURE__*/Symbol('CLIENT_PING_TIMEOUT');
