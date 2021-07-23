/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AppListComponent} from './app-list/app-list.component';
import {FindCapabilitiesComponent} from './find-capabilities/find-capabilities.component';
import {AppDetailsComponent} from './app-details/app-details.component';
import {CapabilityFilterResultComponent} from './capability-filter-result/capability-filter-result.component';

const routes: Routes = [
  {path: '', redirectTo: 'apps', pathMatch: 'full'},
  {
    path: 'find-capabilities',
    children: [
      {path: '', component: FindCapabilitiesComponent},
      {path: 'filter-results', component: CapabilityFilterResultComponent, outlet: 'details'},
    ],
  },
  {
    path: 'apps',
    children: [
      {path: '', component: AppListComponent},
      {path: ':appSymbolicName', component: AppDetailsComponent, outlet: 'details'},
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
