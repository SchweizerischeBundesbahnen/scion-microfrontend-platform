/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Urls} from '../../url.util';

/**
 * Used by {@link OutletRouter} to convert relative paths to absolute paths.
 *
 * Replace this bean to use a different relative path resolution strategy.
 *
 * @see {@link OutletRouter}
 * @category Routing
 */
export class RelativePathResolver {

  /**
   * Converts the given relative path into a navigable URL with relative navigational symbols like `/`, `./`, or `../` resolved.
   *
   * @param  path - Specifies the path which to convert into an absolute path.
   * @param  options - Specifies to which url the given path is relative to.
   * @return the absolute path.
   */
  public resolve(path: string, options: {relativeTo: string}): string {
    const relativeTo = Urls.newUrl(options.relativeTo);

    // Check if hash-based routing is used
    if (relativeTo.hash?.startsWith('#/')) {
      // Apply navigational symbols only to the path of the hash-based route, and not to the context path before the hash, if any.
      // For that reason, we temporarily remove the context path when constructing the URL.
      const {pathname, search, hash} = Urls.newUrl(path, `${relativeTo.origin}${relativeTo.hash.substring(1)}`);
      return relativeTo.origin + relativeTo.pathname + '#' + pathname + search + hash;
    }
    else {
      return Urls.newUrl(path, options.relativeTo).toString();
    }
  }
}

