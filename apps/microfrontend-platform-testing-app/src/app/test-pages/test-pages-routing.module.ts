/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path: 'clear-outlet-then-send-message-test-page',
    data: {pageTitle: 'Test page that clears an outlet and sends a message'},
    loadComponent: (): any => import('./clear-outlet-then-send-message-test-page/clear-outlet-then-send-message-test-page.component').then(m => m.ClearOutletThenSendMessageTestPageComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestPagesRoutingModule {
}
