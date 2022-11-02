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
 * to perform validation checks, add metadata, or change properties.
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
 *         metadata: {...capability.metadata, id: hash(capability)},
 *       };
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
 * ```
 *
 * @category Capability
 */
export abstract class CapabilityInterceptor {

  /**
   * Intercepts a capability before being registered.
   *
   * @param capability - the capability to be intercepted
   */
  public abstract intercept(capability: Capability): Promise<Capability>;
}
