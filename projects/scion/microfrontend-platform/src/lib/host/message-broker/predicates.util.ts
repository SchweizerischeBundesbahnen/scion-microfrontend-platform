/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Provides utilities for working with predicates.
 *
 * NOTE: Use static class instead of namespace to be tree shakable, i.e., to not be included in client app.
 *
 * @internal
 */
export class Predicates {

  private constructor() {
  }

  /**
   * Negates the given predicate.
   */
  public static not<T>(predicate: Predicate<T>): Predicate<T> {
    return (value: T) => !predicate(value);
  }

  /**
   * Represents a predicate that always evaluates to `true`.
   */
  public static alwaysTrue = (): true => true;
}

/**
 * Represents a predicate (boolean-valued function) of one argument.
 *
 * @internal
 */
export type Predicate<T> = (value: T) => boolean;
