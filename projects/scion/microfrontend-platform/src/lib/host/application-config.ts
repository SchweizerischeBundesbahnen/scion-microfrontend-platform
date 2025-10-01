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
 * Describes how to register an application in the platform.
 *
 * @category Platform
 */
export interface ApplicationConfig {
  /**
   * Unique symbolic name of this micro application.
   *
   * The symbolic name must be unique and contain only lowercase alphanumeric characters and hyphens.
   */
  symbolicName: string;
  /**
   * URL to the application manifest.
   */
  manifestUrl: string;
  /**
   * Specifies an additional origin (in addition to the origin of the application) from which the application is allowed
   * to connect to the platform.
   *
   * By default, if not set, the application is allowed to connect from the origin of the manifest URL or the base URL as
   * specified in the manifest file. Setting an additional origin may be necessary if, for example, integrating microfrontends
   * into a rich client, enabling an integrator to bridge messages between clients and host across browser boundaries.
   */
  secondaryOrigin?: string;
  /**
   * Maximum time (in milliseconds) that the host waits until the manifest for this application is loaded.
   *
   * If set, overrides the global timeout as configured in {@link MicrofrontendPlatformConfig.manifestLoadTimeout}.
   */
  manifestLoadTimeout?: number;
  /**
   * Maximum time (in milliseconds) for this application to signal readiness.
   *
   * If activating this application takes longer, the host logs an error and continues startup.
   * If set, overrides the global timeout as configured in {@link MicrofrontendPlatformConfig.activatorLoadTimeout}.
   */
  activatorLoadTimeout?: number;
  /**
   * Excludes this micro application from registration, e.g. to not register it in a specific environment.
   */
  exclude?: boolean;
  /**
   * Allows this application to access private capabilities of other applications.
   *
   * Disabling this check is discouraged. Enabled by default.
   */
  scopeCheckDisabled?: boolean;
  /**
   * Allows this application to access public capabilities of other applications without declaring an intention.
   *
   * Disabling this check is discouraged. Enabled by default.
   */
  intentionCheckDisabled?: boolean;
  /**
   * Allows this application to access inactive capabilities.
   *
   * Disabling this check is discouraged. Enabled by default.
   */
  capabilityActiveCheckDisabled?: boolean;
  /**
   * Allows this application to register and unregister intentions at runtime.
   *
   * Enabling this API is discouraged. Disabled by default.
   */
  intentionRegisterApiDisabled?: boolean;
}
