/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Capability} from '../../platform.model';

/**
 * Allows intercepting capabilities before their registration.
 *
 * Interceptors allow intercepting capabilities before they are registered, for example,
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
 * #### Registering Interceptors
 * Interceptors are registered in the bean manager of the host application under the symbol `CapabilityInterceptor` as multi bean.
 * Multiple interceptors can be registered, forming a chain in which each interceptor is called one by one in registration order.
 *
 * ```ts
 * Beans.register(CapabilityInterceptor, {useClass: MicrofrontendCapabilityInterceptor, multi: true});
 * Beans.register(CapabilityInterceptor, {useClass: UserAuthorizedCapabilityInterceptor, multi: true});
 * ```
 *
 * @category Intention API
 */
export abstract class CapabilityInterceptor {

  /**
   * Intercepts a capability before being registered.
   *
   * @param capability - the capability to be intercepted
   * @return Promise that resolves to the intercepted capability, or `null` to prevent registration.
   */
  public abstract intercept(capability: Capability): Promise<Capability | null>;
}
