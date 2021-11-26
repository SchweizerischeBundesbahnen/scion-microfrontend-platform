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
   * Controls whether this micro application can interact with private capabilities of other micro applications.
   *
   * By default, scope check is enabled. Disabling scope check is discouraged.
   */
  scopeCheckDisabled?: boolean;
  /**
   * Controls whether this micro application can interact with the capabilities of other apps without having to declare respective intentions.
   *
   * By default, intention check is enabled. Disabling intention check is strongly discouraged.
   */
  intentionCheckDisabled?: boolean;
  /**
   * Controls whether this micro application can register and unregister intentions dynamically at runtime.
   *
   * By default, this API is disabled. Enabling this API is strongly discouraged.
   */
  intentionRegisterApiDisabled?: boolean;
}
