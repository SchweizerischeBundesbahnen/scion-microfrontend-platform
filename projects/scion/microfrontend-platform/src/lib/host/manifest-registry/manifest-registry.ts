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
import {Intent} from '../../messaging.model';
import {Observable} from 'rxjs';

/**
 * Central point for looking up or managing capabilities or intentions available in the platform.
 *
 * @internal
 */
export abstract class ManifestRegistry {

  /**
   * Returns capabilities which are visible to the given application and match the given intent.
   * The intent is not allowed to contain wildcards in its qualifier.
   */
  public abstract resolveCapabilitiesByIntent(intent: Intent, appSymbolicName: string): Capability[];

  /**
   * Tests whether the given app has declared an intention for the given intent, or is providing a capability matching the given intent.
   */
  public abstract hasIntention(intent: Intent, appSymbolicName: string): boolean;

  /**
   * Registers the given capability for the given application.
   */
  public abstract registerCapability(capability: Capability, appSymbolicName: string): Promise<string>;

  /**
   * Registers the given intention for the given application.
   */
  public abstract registerIntention(intention: Intention, appSymbolicName: string): string;

  /**
   * Notifies when a capability is registered with the platform.
   */
  public abstract readonly capabilityRegister$: Observable<Capability>;

  /**
   * Notifies when capabilities are unregistered from the platform.
   */
  public abstract readonly capabilityUnregister$: Observable<Capability[]>;
}
