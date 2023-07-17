/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import packageJson from 'package.json';
import {ApplicationConfig} from '@scion/microfrontend-platform';

const version = packageJson.version.replace(/\./g, '-');
const devtools: ApplicationConfig | null = {
  symbolicName: 'devtools',
  manifestUrl: `https://scion-microfrontend-platform-devtools-v${version}.vercel.app/assets/manifest.json`,
  intentionCheckDisabled: true,
  scopeCheckDisabled: true,
};

/**
 * Environment used when packaging the app for Vercel.
 */
export const environment = {
  production: true,
  apps: {
    app_1: {
      symbolicName: 'app-1',
      url: `https://scion-microfrontend-platform-testing-app1-v${version}.vercel.app`,
      activatorLoadTimeout: undefined,
    },
    app_2: {
      symbolicName: 'app-2',
      url: `https://scion-microfrontend-platform-testing-app2-v${version}.vercel.app`,
      activatorLoadTimeout: undefined,
    },
    app_3: {
      symbolicName: 'app-3',
      url: `https://scion-microfrontend-platform-testing-app3-v${version}.vercel.app`,
      activatorLoadTimeout: 800, // activator-readiness.e2e-spec.ts & startup-progress.e2e-spec.ts
    },
    app_4: {
      symbolicName: 'app-4',
      url: `https://scion-microfrontend-platform-testing-app4-v${version}.vercel.app`,
      activatorLoadTimeout: undefined,
    },
  },
  activatorLoadTimeout: 20000,
  devtools,
};
