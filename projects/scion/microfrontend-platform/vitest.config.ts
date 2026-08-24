/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

// Vitest configuration file, see link for more information
// https://vitest.dev/config/
// https://vitest.dev/guide/projects

import {defineConfig} from 'vitest/config';

export default defineConfig({
  assetsInclude: '**/*.script.js', // TODO test me
  test: {
    exclude: ['**/spec.util.spec.ts'],
    globals: true, // skip explicit imports in tests for global APIs https://vitest.dev/config/globals
    experimental: {
      preParse: true, // support for .only https://vitest.dev/config/experimental.html#experimental-preparse
    },
  },
});
