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
 * Lifecycle states of the microfrontend platform.
 *
 * @category Platform
 */
export enum PlatformState {
  /**
   * Indicates that the platform is about to start.
   */
  Starting = 1,
  /**
   * Indicates that the platform started.
   */
  Started = 2,
  /**
   * Indicates that the platform is about to stop.
   */
  Stopping = 3,
  /**
   * Indicates that the platform is not yet started.
   */
  Stopped = 4,
}

/**
 * Runlevels are used to control in which startup phase to execute initializers when starting the platform.
 *
 * The platform reports that it has started after all initializers have completed successfully.
 */
export enum Runlevel {
  /**
   * In runlevel 0, the platform host fetches manifests of registered micro applications.
   */
  Zero = 0,
  /**
   * In runlevel 1, the platform constructs eager beans.
   */
  One = 1,
  /**
   * From runlevel 2 and above, messaging is enabled. This is the default runlevel at which initializers execute if not specifying any runlevel.
   */
  Two = 2,
  /**
   * In runlevel 3, the platform host installs activator microfrontends.
   */
  Three = 3,
}
