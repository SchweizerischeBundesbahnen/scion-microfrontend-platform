/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Application} from './platform.model';

/**
 * Represents an application registered in the platform.
 *
 * The version is omitted because not known at the time of registration, but only when first connecting to the host, e.g., in an activator.
 *
 * @internal
 */
export interface ɵApplication extends Omit<Application, 'platformVersion'> {
  /**
   * Specifies the origin(s) where message from this application must originate from. Messages of a different origin will be rejected.
   */
  allowedMessageOrigins: Set<string>;
}

/**
 * Symbol to get the version of the SCION Microfrontend Platform.
 *
 * @internal
 */
export const ɵVERSION = Symbol('ɵVERSION');

/**
 * Symbol to get the topmost window in the window hierarchy from the bean manager.
 *
 * Alias for `window.top` that can be overridden in tests, e.g., to simulate
 * the client to connect to a remote host.
 *
 * @internal
 */
export const ɵWINDOW_TOP = Symbol('ɵWINDOW_TOP');
