/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Jasmine 3.5 provides 'mapContaining' matcher, but it is not included in @types/jasmine 3.6.2.
 *
 * In order to let TypeScript know that this matcher exists, we make use of declaration merging
 * for extending the existing Jasmine namespace.
 * @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-namespaces
 */
declare namespace jasmine {
  interface MapContaining<T, U> extends jasmine.AsymmetricMatcher<any> {
    new?(sample: Map<T, U>): Map<T, U>;
  }

  function mapContaining<T, U>(sample: Map<T, U>): MapContaining<T, U>;
}
