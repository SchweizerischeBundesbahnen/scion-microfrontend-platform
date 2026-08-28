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
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export default defineConfig({
  plugins: [
    {
      // Serves compiled *.script.js files (built by esbuild to dist/lib/) at /lib/ so MicrofrontendFixture can load them into iframes.
      // The esbuild build command outputs scripts to dist/lib/, preserving the path structure from src/lib/.
      // MicrofrontendFixture generates HTML that loads scripts via <script src="http://localhost:PORT/lib/...">.
      name: 'serve-esbuild-scripts',
      configureServer(server: import('vite').ViteDevServer): void {
        server.middlewares.use((req, res, next) => {
          const url: string | undefined = req.url;
          if (url?.includes('.script.js')) {
            const filePath = resolve(process.cwd(), 'dist', url.split('?')[0]!.slice(1));
            if (existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/javascript');
              res.setHeader('Cache-Control', 'no-cache');
              res.end(readFileSync(filePath));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  test: {
    exclude: ['**/spec.util.spec.ts'],
    globals: true, // skip explicit imports in tests for global APIs https://vitest.dev/config/globals
    experimental: {
      preParse: true, // support for .only https://vitest.dev/config/experimental.html#experimental-preparse
    },
  },
});
