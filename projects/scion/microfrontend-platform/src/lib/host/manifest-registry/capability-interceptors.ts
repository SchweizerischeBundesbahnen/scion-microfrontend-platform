/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Capability, Intention} from '../../platform.model';

/**
 * Enables modification of capabilities before they are registered.
 *
 * Interceptors can intercept capabilities before they are registered, for example,
 * to perform validation checks, add metadata, change properties, or prevent registration
 * based on user permissions.
 *
 * The following interceptor assigns a stable identifier to each microfrontend capability.
 *
 * ```ts
 * class MicrofrontendCapabilityInterceptor implements CapabilityInterceptor {
 *
 *   public async intercept(capability: Capability): Promise<Capability> {
 *     if (capability.type === 'microfrontend') {
 *       return {
 *         ...capability,
 *         // `hash()` is illustrative and not part of the Microfrontend Platform API
 *         metadata: {...capability.metadata, id: hash(capability)},
 *       };
 *     }
 *     return capability;
 *   }
 * }
 * ```
 *
 * The following interceptor rejects capabilities based on user permissions.
 *
 * ```ts
 * class UserAuthorizedCapabilityInterceptor implements CapabilityInterceptor {
 *
 *   public async intercept(capability: Capability): Promise<Capability | null> {
 *     const requiredRole = capability.properties?.['role'];
 *
 *     // `hasRole()` is illustrative and not part of the Microfrontend Platform API
 *     return !requiredRole || hasRole(requiredRole) ? capability : null;
 *   }
 * }
 * ```
 *
 * The following interceptor extracts user information to a new capability.
 *
 * ```ts
 * class UserCapabilityMigrator implements CapabilityInterceptor {
 *
 *   public async intercept(capability: Capability, manifest: CapabilityInterceptor.Manifest): Promise<Capability> {
 *     if (capability.type === 'user' && capability.properties['info']) {
 *       // Move user info to new capability.
 *       await manifest.addCapability({
 *         type: 'user-info',
 *         properties: {
 *           ...capability.properties['info'],
 *         },
 *       });
 *       // Remove info on intercepted capability.
 *       delete capability.properties['info'];
 *     }
 *     return capability;
 *   }
 * }
 * ```
 *
 * #### Registering Interceptors
 * Interceptors are registered in the bean manager of the host application under the symbol `CapabilityInterceptor` as multi bean.
 * Multiple interceptors can be registered, forming a chain in which each interceptor is called one by one in registration order.
 *
 * ```ts
 * Beans.register(CapabilityInterceptor, {useClass: MicrofrontendCapabilityInterceptor, multi: true});
 * Beans.register(CapabilityInterceptor, {useClass: UserAuthorizedCapabilityInterceptor, multi: true});
 * Beans.register(CapabilityInterceptor, {useClass: UserCapabilityMigrator, multi: true});
 * ```
 *
 * @category Intention API
 */
export abstract class CapabilityInterceptor {

  /**
   * Intercepts a capability before being registered.
   *
   * An interceptor can add extra capabilities and intentions to the manifest of the intercepted capability. This may be necessary to migrate capabilities.
   *
   * @param capability - Capability to be intercepted.
   * @param manifest - Manifest of the application that provides the intercepted capability, allowing for the registration of extra capabilities and intentions.
   * @return Promise that resolves to the intercepted capability, or `null` to prevent registration.
   */
  public abstract intercept(capability: Capability, manifest: CapabilityInterceptor.Manifest): Promise<Capability | null>;
}

/**
 * Declares objects local to CapabilityInterceptor.
 */
export namespace CapabilityInterceptor {

  /**
   * Manifest of the application that provides the intercepted capability.
   */
  export interface Manifest {

    /**
     * Adds specified capability to the application of the intercepted capability.
     */
    addCapability(capability: Capability): Promise<string | null>;

    /**
     * Adds specified intention to the application of the intercepted capability.
     */
    addIntention(intention: Intention): Promise<string>;
  }
}
