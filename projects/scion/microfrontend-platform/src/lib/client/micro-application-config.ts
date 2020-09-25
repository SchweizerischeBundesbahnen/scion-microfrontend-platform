/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/**
 * Configures a micro application to connect to the platform.
 *
 * @category Platform
 */
export abstract class MicroApplicationConfig {
  /**
   * Specifies the symbolic name of the micro application. The micro application must be registered in the host application under this symbol.
   */
  public symbolicName: string;
  /**
   * Configures interaction with the message broker.
   */
  public messaging?: {
    /**
     * Disables messaging, useful in tests when not connecting to the platform host. By default, messaging is enabled.
     */
    enabled?: boolean;
    /**
     * Specifies the maximal time (in milliseconds) to wait until the message broker is discovered on platform startup. If the broker is not discovered within
     * the specified time, platform startup fails with an error. By default, a timeout of 10s is used.
     */
    brokerDiscoverTimeout?: number;
    /**
     * Specifies the maximal time (in milliseconds) to wait to receive dispatch confirmation when sending a message. Otherwise, the Promise for sending the
     * message rejects with an error. By default, a timeout of 10s is used.
     */
    deliveryTimeout?: number;
  };
}
