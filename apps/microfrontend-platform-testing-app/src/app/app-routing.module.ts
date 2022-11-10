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
import {BrowserOutletsComponent} from './browser-outlets/browser-outlets.component';
import {ReceiveMessageComponent} from './messaging/receive-message/receive-message.component';
import {RegisterCapabilityComponent} from './manifest/register-capability/register-capability.component';
import {RegisterIntentionComponent} from './manifest/register-intention/register-intention.component';
import {ContextComponent} from './outlet-context/context/context.component';
import {OutletRouterComponent} from './outlet-router/outlet-router.component';
import {PublishMessageComponent} from './messaging/publish-message/publish-message.component';
import {RouterOutletComponent} from './router-outlet/router-outlet.component';
import {MicrofrontendComponent} from './microfrontend/microfrontend.component';
import {ScrollableMicrofrontendComponent} from './scrollable-microfrontend/scrollable-microfrontend.component';
import {PreferredSizeComponent} from './preferred-size/preferred-size.component';
import {PlatformPropertiesComponent} from './platform-properties/platform-properties.component';
import {LookupCapabilityComponent} from './manifest/lookup-capability/lookup-capability.component';
import {LookupIntentionComponent} from './manifest/lookup-intention/lookup-intention.component';
import {AppShellComponent} from './app-shell/app-shell.component';
import {LookupContextValueComponent} from './outlet-context/lookup-context-value/lookup-context-value.component';

const routes: Routes = [
  {path: 'activator/readiness', loadChildren: (): any => import('./activator/activator-readiness.module').then(m => m.ActivatorReadinessModule)},
  {path: 'activator/progress', loadChildren: (): any => import('./activator/activator-progress.module').then(m => m.ActivatorProgressModule)},
  {path: 'activator/routing', loadChildren: (): any => import('./activator/activator-routing.module').then(m => m.ActivatorRoutingModule)},
  {path: '', redirectTo: 'browser-outlets;count=2', pathMatch: 'full'},
  {
    path: '',
    component: AppShellComponent,
    children: [
      {path: 'browser-outlets', component: BrowserOutletsComponent, data: {pageTitle: 'Allows displaying web content in one or more browser outlets', matrixParams: new Map().set('count', 2), pageTitleVisible: false}},
      {path: 'router-outlet', component: RouterOutletComponent, data: {pageTitle: 'Allows displaying web content in a router outlet'}},
      {path: 'outlet-router', component: OutletRouterComponent, data: {pageTitle: 'Allows controlling the web content to be displayed in a router outlet'}},
      {path: 'publish-message', component: PublishMessageComponent, data: {pageTitle: 'Allows publishing messages'}},
      {path: 'receive-message', component: ReceiveMessageComponent, data: {pageTitle: 'Allows receiving messages'}},
      {path: 'register-capability', component: RegisterCapabilityComponent, data: {pageTitle: 'Allows managing capabilities'}},
      {path: 'lookup-capability', component: LookupCapabilityComponent, data: {pageTitle: 'Allows looking up capabilities'}},
      {path: 'lookup-intention', component: LookupIntentionComponent, data: {pageTitle: 'Allows looking up intentions'}},
      {path: 'register-intention', component: RegisterIntentionComponent, data: {pageTitle: 'Allows managing intentions'}},
      {path: 'context', component: ContextComponent, data: {pageTitle: 'Allows showing the context at this level in the context tree'}},
      {path: 'lookup-context-value', component: LookupContextValueComponent, data: {pageTitle: 'Allows looking up a context value'}},
      {path: 'microfrontend-1', component: MicrofrontendComponent, data: {pageTitle: 'Displays the \'microfrontend-1\' page'}},
      {path: 'microfrontend-2', component: MicrofrontendComponent, data: {pageTitle: 'Displays the \'microfrontend-2\' page'}},
      {path: 'microfrontend-2/:param1/:param2', component: MicrofrontendComponent},
      {path: 'scrollable-microfrontend', component: ScrollableMicrofrontendComponent, data: {pageTitle: 'Displays a microfrontend with some tall content displayed in a viewport'}},
      {path: 'preferred-size', component: PreferredSizeComponent, data: {pageTitle: 'Allows playing around with the microfrontend\'s preferred size'}},
      {path: 'platform-properties', component: PlatformPropertiesComponent, data: {pageTitle: 'Shows properties that are registered in the platform'}},
      {path: 'test-pages', loadChildren: (): any => import('./test-pages/test-pages-routing.module').then(m => m.TestPagesRoutingModule)},
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
