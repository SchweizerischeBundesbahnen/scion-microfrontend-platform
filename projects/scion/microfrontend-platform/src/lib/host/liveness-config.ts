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
 * Configures the liveness probe performed between host and clients to detect and dispose stale clients.
 * Clients not replying to the probe are removed.
 *
 * @category Platform
 */
export interface LivenessConfig {
  /**
   * Interval (in seconds) at which liveness probes are performed between host and connected clients.
   * Note that the interval must not be 0 and be greater than twice the timeout period to give a probe enough time to complete before performing a new probe.
   *
   * By default, if not set, an interval of 60s is used.
   */
  interval: number;
  /**
   * Timeout (in seconds) after which a client is unregistered if not replying to the probe.
   * Note that timeout must not be 0 and be less than half the interval period to give a probe enough time to complete before performing a new probe.
   *
   * By default, if not set, a timeout of 10s is used.
   */
  timeout: number;
}
