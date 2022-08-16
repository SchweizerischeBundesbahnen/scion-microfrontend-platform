/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms from the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Provides element selectors for SCION Microfrontend Platform e2e tests.
 */
export namespace ElementSelectors {

  /**
   * Returns the selector for the <sci-router-outlet> element with the given name.
   */
  export function routerOutlet(outletName?: string): string {
    if (outletName) {
      return `sci-router-outlet[name="${outletName}"]`;
    }
    return `sci-router-outlet`;
  }

  /**
   * Returns the selector for the <iframe> contained within the <sci-router-outlet> element with the given name.
   */
  export function routerOutletFrame(outletName?: string): string {
    return `${routerOutlet(outletName)} iframe`;
  }
}
