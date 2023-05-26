/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Routes} from '@angular/router';
import {AppListComponent} from './app-list/app-list.component';
import {AppDetailsComponent} from './app-details/app-details.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'apps',
    pathMatch: 'full',
  },
  {
    path: 'find-capabilities',
    children: [
      {
        path: '',
        loadComponent: () => import('./find-capabilities/find-capabilities.component'),
      },
      {
        path: 'filter-results',
        loadComponent: () => import('./capability-filter-result/capability-filter-result.component'),
        outlet: 'details',
      },
    ],
  },
  {
    path: 'apps',
    children: [
      {
        path: '',
        component: AppListComponent,
      },
      {
        path: ':appSymbolicName',
        component: AppDetailsComponent,
        outlet: 'details',
      },
    ],
  },
];
