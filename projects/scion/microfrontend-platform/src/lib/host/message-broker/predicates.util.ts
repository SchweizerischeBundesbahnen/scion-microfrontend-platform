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
 */
export namespace Predicates {

  /**
   * Negates the given predicate.
   */
  export function not<T>(predicate: Predicate<T>): Predicate<T> {
    return (value: T) => !predicate(value);
  }
}

/**
 * Represents a predicate (boolean-valued function) of one argument.
 */
export type Predicate<T> = (value: T) => boolean;
