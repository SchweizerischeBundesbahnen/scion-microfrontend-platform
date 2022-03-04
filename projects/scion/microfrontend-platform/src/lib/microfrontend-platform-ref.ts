/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {PlatformState} from './platform-state';
import {Observable} from 'rxjs';

/**
 * Provides access to {@link MicrofrontendPlatform}.
 *
 * Use this bean from within a class which is itself referenced in the {@link MicrofrontendPlatform}, in order to avoid ES2015 import cycles.
 *
 * @ignore
 */
export abstract class MicrofrontendPlatformRef {

  /**
   * @see {@link MicrofrontendPlatform#whenState}
   */
  public abstract whenState(state: PlatformState): Promise<void>;

  /**
   * @see {@link MicrofrontendPlatform#state}
   */
  public abstract state: PlatformState;

  /**
   * @see {@link MicrofrontendPlatform#state$}
   */
  public abstract state$: Observable<PlatformState>;

  /**
   * @see {@link MicrofrontendPlatform#destroy}
   */
  public abstract destroy(): void;
}
