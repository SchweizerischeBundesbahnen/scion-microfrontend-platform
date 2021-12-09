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
 * Entry point for all public APIs of this package.
 */
export * from './microfrontend-platform-config';
export * from './host-config';
export * from './application-config';
export * from './manifest-registry/public_api';
export * from './activator/public_api';
export * from './message-broker/message-interception';
export {HostManifestInterceptor} from './host-manifest-interceptor';
