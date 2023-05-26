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

export const routes: Routes = [
  {
    path: 'activator/readiness',
    loadChildren: () => import('./activator/activator-readiness.module'),
  },
  {
    path: 'activator/progress',
    loadChildren: () => import('./activator/activator-progress.module'),
  },
  {
    path: 'activator/routing',
    loadChildren: () => import('./activator/activator-routing.module'),
  },
  {
    path: '',
    redirectTo: 'browser-outlets;count=2',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./app-shell/app-shell.component'),
    children: [
      {
        path: 'browser-outlets',
        loadComponent: () => import('./browser-outlets/browser-outlets.component'),
        data: {pageTitle: 'Allows displaying web content in one or more browser outlets', matrixParams: new Map().set('count', 2), pageTitleVisible: false},
      },
      {
        path: 'router-outlet',
        loadComponent: () => import('./router-outlet/router-outlet.component'),
        data: {pageTitle: 'Allows displaying web content in a router outlet'},
      },
      {
        path: 'outlet-router',
        loadComponent: () => import('./outlet-router/outlet-router.component'),
        data: {pageTitle: 'Allows controlling the web content to be displayed in a router outlet'},
      },
      {
        path: 'publish-message',
        loadComponent: () => import('./messaging/publish-message/publish-message.component'),
        data: {pageTitle: 'Allows publishing messages'},
      },
      {
        path: 'receive-message',
        loadComponent: () => import('./messaging/receive-message/receive-message.component'),
        data: {pageTitle: 'Allows receiving messages'},
      },
      {
        path: 'register-capability',
        loadComponent: () => import('./manifest/register-capability/register-capability.component'),
        data: {pageTitle: 'Allows managing capabilities'},
      },
      {
        path: 'lookup-capability',
        loadComponent: () => import('./manifest/lookup-capability/lookup-capability.component'),
        data: {pageTitle: 'Allows looking up capabilities'},
      },
      {
        path: 'lookup-intention',
        loadComponent: () => import('./manifest/lookup-intention/lookup-intention.component'),
        data: {pageTitle: 'Allows looking up intentions'},
      },
      {
        path: 'register-intention',
        loadComponent: () => import('./manifest/register-intention/register-intention.component'),
        data: {pageTitle: 'Allows managing intentions'},
      },
      {
        path: 'context',
        loadComponent: () => import('./outlet-context/context/context.component'),
        data: {pageTitle: 'Allows showing the context at this level in the context tree'},
      },
      {
        path: 'lookup-context-value',
        loadComponent: () => import('./outlet-context/lookup-context-value/lookup-context-value.component'),
        data: {pageTitle: 'Allows looking up a context value'},
      },
      {
        path: 'preferred-size',
        loadComponent: () => import('./preferred-size/preferred-size.component'),
        data: {pageTitle: 'Allows playing around with the microfrontend\'s preferred size'},
      },
      {
        path: 'platform-properties',
        loadComponent: () => import('./platform-properties/platform-properties.component'),
        data: {pageTitle: 'Shows properties that are registered in the platform'},
      },
      {
        path: 'test-pages',
        loadChildren: () => import('./test-pages/routes'),
      },
    ],
  },
];
