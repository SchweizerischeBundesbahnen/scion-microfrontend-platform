/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Qualifier } from './platform.model';

/**
 * Allows testing whether a qualifier matches a qualifier pattern.
 */
export class QualifierMatcher {

  private readonly _pattern: Qualifier;
  private readonly _patternKeys: string[];
  private readonly _flags: Flags;

  /**
   * Constructs a matcher that will match given qualifiers against a pattern.
   *
   * @param pattern - Pattern to match qualifiers. If `null` or `undefined`, uses an empty qualifier pattern.
   * @param flags   - Controls how to match qualifiers.
   */
  constructor(pattern: Qualifier | null | undefined, flags: Flags) {
    this._pattern = pattern || {};
    this._patternKeys = Object.keys(this._pattern);
    this._flags = flags;
  }

  /**
   * Attempts to match the given qualifier against the pattern which was passed to the constructor.
   */
  public matches(qualifier: Qualifier | null | undefined): boolean {
    const testee = qualifier || {};
    const testeeKeys = Object.keys(testee);
    const {_patternKeys: patternKeys, _pattern: pattern, _flags: flags} = this;

    // Test if the testee has no additional entries
    if (!patternKeys.includes('*') && testeeKeys.some(key => !patternKeys.includes(key))) {
      return false;
    }

    return patternKeys
      .filter(key => key !== '*')
      .every(key => {
        if (pattern[key] === testee[key]) {
          return true;
        }
        if (flags.evalOptional && pattern[key] === '?') {
          return true;
        }
        if (flags.evalAsterisk && pattern[key] === '*' && testee[key] !== undefined && testee[key] !== null) {
          return true;
        }
        return false;
      });
  }
}

/**
 * Asserts the given qualifier not to contain wildcards.
 *
 * For example, the qualifier of an intent must be exact. The qualifier of an intention, on the other hand, allows wildcards.
 *
 * @internal
 */
export function assertExactQualifier(qualifier: Qualifier | null | undefined): void {
  if (!qualifier || Object.keys(qualifier).length === 0) {
    return;
  }

  if (Object.entries(qualifier).some(([key, value]) => key === '*' || value === '*' || value === '?')) {
    throw Error(`[IllegalQualifierError] Intent qualifier must not contain wildcards. [qualifier='${JSON.stringify(qualifier)}']`);
  }
}

/**
 * Controls how to match qualifiers.
 */
export interface Flags {
  /**
   * Flag to enable wildcard matching. If `false`, the asterisk wildcard character (`*`) is interpreted as value.
   */
  evalAsterisk: boolean;
  /**
   * Flag to enable optional qualifier entry matching. If `false`, the question mark wildcard character (`?`) is interpreted as value.
   */
  evalOptional: boolean;
}
