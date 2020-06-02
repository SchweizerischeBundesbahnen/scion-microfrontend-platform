/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

export const environment = {
  production: true,
  apps: {
    app_1: {
      symbolicName: 'app-1',
      url: 'http://localhost:4201',
    },
    app_2: {
      symbolicName: 'app-2',
      url: 'http://localhost:4202',
    },
    app_3: {
      symbolicName: 'app-3',
      url: 'http://localhost:4203',
    },
    app_4: {
      symbolicName: 'app-4',
      url: 'http://localhost:4204',
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
