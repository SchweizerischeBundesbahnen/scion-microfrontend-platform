/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { version } from 'package.json';

export const environment = {
  production: true,
  apps: {
    app_1: {
      symbolicName: 'app-1',
      url: `https://scion-microfrontend-platform-testing-app1-v${version.replace(/\./g, '-')}.now.sh`,
    },
    app_2: {
      symbolicName: 'app-2',
      url: `https://scion-microfrontend-platform-testing-app2-v${version.replace(/\./g, '-')}.now.sh`,
    },
    app_3: {
      symbolicName: 'app-3',
      url: `https://scion-microfrontend-platform-testing-app3-v${version.replace(/\./g, '-')}.now.sh`,
    },
    app_4: {
      symbolicName: 'app-4',
      url: `https://scion-microfrontend-platform-testing-app4-v${version.replace(/\./g, '-')}.now.sh`,
    },
  },
};
