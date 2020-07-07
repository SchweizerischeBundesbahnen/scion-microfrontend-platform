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
 * Runlevels are used to control in which startup phase to execute initializers.
 */

/**
 * In runlevel 0, the platform fetches application manifests.
 */
export const RUNLEVEL_0 = 0;
/**
 * In runlevel 1, the platform constructs eager beans.
 */
export const RUNLEVEL_1 = 1;
/**
 * From runlevel 2 and above, messaging is enabled. This is the default runlevel at which initializers execute if not specifying a runlevel.
 */
export const RUNLEVEL_2 = 2;
