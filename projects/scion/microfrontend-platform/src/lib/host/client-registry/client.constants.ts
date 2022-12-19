/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Specifies the interval (in milliseconds) at which the host pings connected clients.
 *
 * By default, if not set, a ping interval of 60s is used.
 *
 * @internal
 */
export const CLIENT_PING_INTERVAL = Symbol('CLIENT_PING_INTERVAL');

/**
 * Specifies the ping timeout (in milliseconds) for unregistering a client.
 *
 * By default, if not set, clients are unregistered if not answering the ping within 10 seconds.
 *
 * @internal
 */
export const CLIENT_PING_TIMEOUT = Symbol('CLIENT_PING_TIMEOUT');
