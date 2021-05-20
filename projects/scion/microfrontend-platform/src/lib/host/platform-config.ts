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
 * Configures the platform and defines the micro applications running in the platform.
 *
 * @category Platform
 */
export abstract class PlatformConfig {
  /**
   * Defines the micro applications running in the platform.
   */
  public abstract readonly apps: ApplicationConfig[];
  /**
   * Maximum time (in milliseconds) for each application to fetch its manifest.
   * You can set a different timeout per application via {@link ApplicationConfig.manifestLoadTimeout}.
   * If not set, by default, the browser's HTTP fetch timeout applies.
   *
   * Consider setting this timeout if, for example, a web application firewall delays the responses of unavailable
   * applications.
   */
  public abstract readonly manifestLoadTimeout?: number;
  /**
   * Maximum time (in milliseconds) that the host waits for each application to signal readiness.
   * Has no effect for applications having no activator(s) or are not configured to signal readiness.
   * You can set a different timeout per application via {@link ApplicationConfig.activatorLoadTimeout}.
   * By default, no timeout is set.
   *
   * If an app fails to signal its readiness, e.g., due to an error, setting no timeout would cause
   * that app to block the startup process indefinitely.
   */
  public abstract readonly activatorLoadTimeout?: number;
  /**
   * Defines user-defined properties which can be read by micro applications via {@link PlatformPropertyService}.
   */
  public abstract readonly properties?: {
    [key: string]: any;
  };
  /**
   * Platform flags are settings and features that you can enable to change how the platform works.
   */
  public abstract readonly platformFlags?: PlatformFlags;
}

/**
 * Describes how to register an application in the platform.
 *
 * @category Platform
 */
export interface ApplicationConfig {
  /**
   * Unique symbolic name of this micro application.
   *
   * Choose a short, lowercase name which contains alphanumeric characters and optionally dash characters.
   */
  symbolicName: string;
  /**
   * URL to the application manifest.
   */
  manifestUrl: string;
  /**
   * Maximum time (in milliseconds) that the host waits for this application to fetch its manifest.
   *
   * If set, overrides the global timeout as configured in {@link PlatformConfig.manifestLoadTimeout}.
   */
  manifestLoadTimeout?: number;
  /**
   * Maximum time (in milliseconds) that the host waits for this application to signal readiness.
   *
   * If set, overrides the global timeout as configured in {@link PlatformConfig.activatorLoadTimeout}.
   */
  activatorLoadTimeout?: number;

  /**
   * Excludes this micro application from registration, e.g. to not register it in a specific environment.
   */
  exclude?: boolean;
  /**
   * Sets whether or not this micro application can issue intents to private capabilities of other apps.
   *
   * By default, scope check is enabled. Disabling scope check is discouraged.
   */
  scopeCheckDisabled?: boolean;
  /**
   * Sets whether or not this micro application can look up intentions or issue intents for which it has not declared a respective intention.
   *
   * By default, intention check is enabled. Disabling intention check is strongly discouraged.
   */
  intentionCheckDisabled?: boolean;
  /**
   * Sets whether or not the API to manage intentions is disabled for this micro application.
   *
   * By default, this API is disabled. With this API enabled, the application can register and
   * unregister intentions dynamically at runtime. Enabling this API is strongly discouraged.
   */
  intentionRegisterApiDisabled?: boolean;
}

/**
 * Platform flags are settings and features that you can enable to change how the platform works.
 *
 * @category Platform
 */
export abstract class PlatformFlags {
  /**
   * Sets whether or not the API to provide application activators is disabled.
   *
   * By default, this API is enabled.
   *
   * @see {@link Activator}
   */
  public activatorApiDisabled?: boolean;
}
