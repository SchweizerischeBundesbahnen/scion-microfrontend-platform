/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationConfig} from './application-config';
import {HostConfig} from './host-config';

/**
 * Configures the platform and defines the micro applications running in the platform.
 *
 * @category Platform
 */
export abstract class MicrofrontendPlatformConfig {
  /**
   * Lists the micro applications able to connect to the platform to interact with other micro applications.
   */
  public abstract readonly applications: ApplicationConfig[];
  /**
   * Configures the interaction of the host application with the platform.
   *
   * As with micro applications, you can provide a manifest for the host, allowing the host to contribute capabilities and declare intentions.
   */
  public abstract readonly host?: HostConfig;
  /**
   * Controls whether the Activator API is enabled.
   *
   * Activating the Activator API enables micro applications to contribute `activator` microfrontends. Activator microfrontends are loaded
   * at platform startup for the entire lifecycle of the platform. An activator is a startup hook for micro applications to initialize
   * or register message or intent handlers to provide functionality.
   *
   * By default, this API is enabled.
   *
   * @see {@link Activator}
   */
  public abstract readonly activatorApiDisabled?: boolean;
  /**
   * Maximum time (in milliseconds) that the platform waits until the manifest of an application is loaded.
   * You can set a different timeout per application via {@link ApplicationConfig.manifestLoadTimeout}.
   * If not set, by default, the browser's HTTP fetch timeout applies.
   *
   * Consider setting this timeout if, for example, a web application firewall delays the responses of unavailable
   * applications.
   */
  public abstract readonly manifestLoadTimeout?: number;
  /**
   * Maximum time (in milliseconds) for each application to signal readiness.
   *
   * If specified and activating an application takes longer, the host logs an error and continues startup.
   * Has no effect for applications which provide no activator(s) or are not configured to signal readiness.
   * You can set a different timeout per application via {@link ApplicationConfig.activatorLoadTimeout}.
   *
   * By default, no timeout is set, meaning that if an app fails to signal readiness, e.g., due to an error,
   * that app would block the host startup process indefinitely. It is therefore recommended to specify a
   * timeout accordingly.
   */
  public abstract readonly activatorLoadTimeout?: number;
  /**
   * Defines user-defined properties which can be read by micro applications via {@link PlatformPropertyService}.
   */
  public abstract readonly properties?: {
    [key: string]: any;
  };
}
