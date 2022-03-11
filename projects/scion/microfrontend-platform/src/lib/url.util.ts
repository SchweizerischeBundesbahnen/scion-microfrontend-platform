/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/** @ignore */
const ABSOLUTE_URL_REGEX = /^http[s]?:\/\//;

/**
 * @ignore
 */
export namespace Urls {

  /**
   * Returns `true` if the given URL is an absolute URL or the 'about:blank' page.
   */
  export function isAbsoluteUrl(url: string): boolean {
    return url === 'about:blank' || ABSOLUTE_URL_REGEX.test(url);
  }

  /**
   * Constructs the {@link URL} for the given url and optional base, applying relative navigational symbols if contained in the url.
   *
   * Following rules apply:
   * - base is required if providing a relative url
   * - search and fragment parts of the base are ignored
   * - relative navigational symbols are only applied if passing a base (native support)
   *
   * This function is similar to `new URL(url, base)` except that it works for bases that do not have a trailing slash.
   * If you use `new URL(url, base)` without a trailing slash in the base, the last segment is discarded.
   *
   * // new URL('x/y', 'http://localhost:4200/a/b/').toString() -> "http://localhost:4200/a/b/x/y" // what we expect
   * // new URL('x/y', 'http://localhost:4200/a/b').toString() -> "http://localhost:4200/a/x/y" // not what we expect
   *
   * We observed this behavior in Chromium and Firefox browsers.
   */
  export function newUrl(url: string, base?: string): URL {
    if (base) {
      const baseUrl = new URL(base);
      if (baseUrl.pathname && !baseUrl.pathname.endsWith('/')) {
        baseUrl.pathname += '/';
      }
      return new URL(url, baseUrl);
    }

    return new URL(url);
  }

  /**
   * Adds a trailing slash to the given URL, if not already present.
   */
  export function ensureTrailingSlash(url: string): string {
    if (!url.endsWith('/')) {
      return url + '/';
    }
    return url;
  }
}
