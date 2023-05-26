/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Routes} from '@angular/router';

export default [
  {
    path: 'clear-outlet-then-send-message-test-page',
    loadComponent: () => import('./clear-outlet-then-send-message-test-page/clear-outlet-then-send-message-test-page.component'),
    data: {pageTitle: 'Test page that clears an outlet and sends a message'},
  },
  {
    path: 'mouse-event-dispatch-test-page',
    loadComponent: () => import('./mouse-event-dispatch-test-page/mouse-event-dispatch-test-page.component'),
    data: {pageTitle: 'Test page to test mouse event dispatching'},
  },
  {
    path: 'angular-zone-test-page',
    loadComponent: () => import('./angular-zone-test-page/angular-zone-test-page.component'),
    data: {pageTitle: 'Test page to test NgZone Synchronization'},
  },
  {
    path: 'angular-change-detection-test-page',
    loadComponent: () => import('./angular-change-detection-test-page/angular-change-detection-test-page.component'),
    data: {pageTitle: 'Test page to test Angular change detection cycles'},
  },
  {
    path: 'microfrontend-1-test-page',
    loadComponent: () => import('./microfrontend/microfrontend.component'),
    data: {pageTitle: 'Displays the \'microfrontend-1\' page'},
  },
  {
    path: 'microfrontend-2-test-page',
    loadComponent: () => import('./microfrontend/microfrontend.component'),
    data: {pageTitle: 'Displays the \'microfrontend-2\' page'},
  },
  {
    path: 'microfrontend-2-test-page/:param1/:param2',
    loadComponent: () => import('./microfrontend/microfrontend.component'),
  },
  {
    path: 'scrollable-microfrontend-test-page',
    loadComponent: () => import('./scrollable-microfrontend/scrollable-microfrontend.component'),
    data: {pageTitle: 'Displays a microfrontend with some tall content displayed in a viewport'},
  },
] satisfies Routes;
