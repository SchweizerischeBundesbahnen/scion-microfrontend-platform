/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Qualifier} from './platform.model';

/**
 * Provides utilities for working with qualifiers.
 *
 * @internal
 */
export namespace Qualifiers {

  const ALLOWED_VALUE_TYPES = new Set<string>().add('string').add('number').add('boolean');

  /**
   * Validates given qualifier.
   *
   * @return `null` if valid, or the `Error` otherwise.
   */
  export function validateQualifier(qualifier: Qualifier | null | undefined, options: {exactQualifier: boolean}): Error | null {
    if (!qualifier || Object.keys(qualifier).length === 0) {
      return null;
    }
    if (options.exactQualifier && Object.entries(qualifier).some(([key, value]) => key === '*' || value === '*')) {
      return Error(`[IllegalQualifierError] Qualifier must be exact, i.e., not contain wildcards. [qualifier='${JSON.stringify(qualifier)}']`);
    }
    if (Object.values(qualifier).some(value => value === '' || value === null || value === undefined)) {
      return Error(`[IllegalQualifierError] Qualifier must not contain empty, \`null\`, or \`undefined\` entries. [qualifier='${JSON.stringify(qualifier)}']`);
    }
    if (Object.values(qualifier).some(value => !ALLOWED_VALUE_TYPES.has(typeof value))) {
      return Error(`[IllegalQualifierError] Qualifier contains entries with an illegal data type. Supported data types are [${[...ALLOWED_VALUE_TYPES].join(', ')}]. [qualifier='${JSON.stringify(qualifier)}']`);
    }
    return null;
  }
}
