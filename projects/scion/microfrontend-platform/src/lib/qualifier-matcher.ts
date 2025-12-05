/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Qualifier} from './platform.model';

/**
 * Allows testing whether a qualifier matches a qualifier pattern.
 *
 * @category Intention API
 */
export class QualifierMatcher {

  private readonly _pattern: Qualifier;
  private readonly _patternKeys: string[];

  /**
   * Constructs a matcher that will match given qualifiers against a pattern.
   *
   * @param pattern - Pattern to match qualifiers. If `null` or `undefined`, uses an empty qualifier pattern.
   */
  constructor(pattern: Qualifier | null | undefined) {
    this._pattern = pattern ?? {};
    this._patternKeys = Object.keys(this._pattern);
  }

  /**
   * Attempts to match the given qualifier against the pattern which was passed to the constructor.
   */
  public matches(qualifier: Qualifier | null | undefined): boolean {
    const testee = qualifier ?? {};
    const testeeKeys = Object.keys(testee);
    const {_patternKeys: patternKeys, _pattern: pattern} = this;

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
        if (pattern[key] === '*' && !!testee[key]) {
          return true;
        }
        return false;
      });
  }
}
