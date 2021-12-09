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
export abstract class HostConfig {
  /**
   * Symbolic name of the host. If not set, 'host' is used as the symbolic name of the host.
   *
   * The symbolic name must be unique and contain only lowercase alphanumeric characters and hyphens.
   */
  public abstract symbolicName?: string;
  /**
   * The manifest of the host.
   *
   * The manifest can be passed either as an {@link Manifest object literal} or specified as a URL to be loaded over the network.
   * Providing a manifest lets the host contribute capabilities or declare intentions.
   */
  public abstract readonly manifest?: Manifest | string;
  /**
   * Controls whether the host can interact with private capabilities of other micro applications.
   *
   * By default, scope check is enabled. Disabling scope check is strongly discouraged.
   */
  public abstract readonly scopeCheckDisabled?: boolean;
  /**
   * Controls whether the host can interact with the capabilities of other apps without having to declare respective intentions.
   *
   * By default, intention check is enabled. Disabling intention check is strongly discouraged.
   */
  public abstract readonly intentionCheckDisabled?: boolean;
  /**
   * Controls whether the host can register and unregister intentions dynamically at runtime.
   *
   * By default, this API is disabled. Enabling this API is strongly discouraged.
   */
  public abstract readonly intentionRegisterApiDisabled?: boolean;
  /**
   * Maximum time (in milliseconds) that the platform waits to receive dispatch confirmation for messages sent by the host until rejecting the publishing Promise.
   * By default, a timeout of 10s is used.
   */
  public abstract readonly messageDeliveryTimeout?: number;
}
