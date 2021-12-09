/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Controls how to connect to the platform host.
 *
 * @category Platform
 */
export interface ConnectOptions {
  /**
   * Controls whether to actually connect to the platform host.
   *
   * Disabling this flag can be useful in tests to not connect to the platform host but still have platform beans available.
   * In this mode, messaging is disabled, i.e., sending and receiving messages results in a NOOP.
   *
   * By default, this flag is set to `true`.
   */
  connect?: boolean;
  /**
   * Specifies the maximum time (in milliseconds) to wait until the message broker is discovered on platform startup. If the broker is not discovered within
   * the specified time, platform startup fails with an error. By default, a timeout of 10s is used.
   */
  brokerDiscoverTimeout?: number;
  /**
   * Specifies the maximum time (in milliseconds) that the platform waits to receive dispatch confirmation for messages sent by this application until rejecting
   * the publishing Promise. By default, a timeout of 10s is used.
   */
  messageDeliveryTimeout?: number;
}
