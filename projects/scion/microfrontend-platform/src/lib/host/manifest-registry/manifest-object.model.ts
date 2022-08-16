/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Qualifier} from '../../platform.model';

/**
 * Represents an object in the manifest registry like a capability or an intention.
 *
 * @ignore
 */
export interface ManifestObject {
  type: string;
  qualifier?: Qualifier;
  metadata?: {
    id: string;
    appSymbolicName: string;
  };
}

/**
 * Allows filtering manifest objects like capabilities or intentions.
 *
 * All specified filter criteria are "AND"ed together. Unspecified filter criteria are ignored.
 * If no filter criterion is specified, no filtering takes place, thus all available objects are returned.
 *
 * @category Manifest
 */
export interface ManifestObjectFilter {
  /**
   * Manifest objects of the given identity.
   */
  id?: string;
  /**
   * Manifest objects of the given function type.
   */
  type?: string;
  /**
   * Manifest objects matching the given qualifier.
   */
  qualifier?: Qualifier;
  /**
   * Manifest objects provided by the given app.
   */
  appSymbolicName?: string;
}
