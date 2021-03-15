/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { PlatformState } from './platform-state';

/**
 * Provides access to the platform state.
 *
 * Use this bean from within a class which is itself referenced in the {@link MicrofrontendPlatform}, in order to avoid ES2015 import cycles.
 *
 * @see {@link ActivatorInstaller} for an example.
 * @ignore
 */
export abstract class PlatformStateRef {

  public abstract whenState(state: PlatformState): Promise<void>;
}
