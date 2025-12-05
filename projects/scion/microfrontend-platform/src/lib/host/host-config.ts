/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Manifest} from '../platform.model';

/**
 * Configures the interaction of the host application with the platform.
 *
 * As with micro applications, you can provide a manifest for the host, allowing the host to contribute capabilities and declare intentions.
 *
 * @category Platform
 */
export interface HostConfig {
  /**
   * Symbolic name of the host. If not set, 'host' is used as the symbolic name of the host.
   *
   * The symbolic name must be unique and contain only lowercase alphanumeric characters and hyphens.
   */
  symbolicName?: string;
  /**
   * The manifest of the host.
   *
   * The manifest can be passed either as an {@link Manifest object literal} or specified as a URL to be loaded over the network.
   * Providing a manifest lets the host contribute capabilities or declare intentions.
   */
  readonly manifest?: Manifest | string;
  /**
   * Allows the host to access private capabilities of other applications.
   *
   * Disabling this check is discouraged. Enabled by default.
   */
  readonly scopeCheckDisabled?: boolean;
  /**
   * Allows the host to access public capabilities of other applications without declaring an intention.
   *
   * Disabling this check is discouraged. Enabled by default.
   */
  readonly intentionCheckDisabled?: boolean;
  /**
   * Allows the host to access inactive capabilities.
   *
   * Disabling this check is discouraged. Enabled by default.
   */
  readonly capabilityActiveCheckDisabled?: boolean;
  /**
   * Allows the host to register and unregister intentions at runtime.
   *
   * Enabling this API is discouraged. Disabled by default.
   */
  readonly intentionRegisterApiDisabled?: boolean;
  /**
   * Maximum time (in milliseconds) that the platform waits to receive dispatch confirmation for messages sent by the host until rejecting the publishing Promise.
   * By default, a timeout of 10s is used.
   */
  readonly messageDeliveryTimeout?: number;
  /**
   * Maximum time (in milliseconds) to wait until the message broker is discovered on platform startup. If the broker is not discovered within
   * the specified time, platform startup fails with an error. By default, a timeout of 10s is used.
   *
   * @internal
   */
  readonly brokerDiscoverTimeout?: number;
}
