/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule, NgZone} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent, isRunningStandalone} from './app.component';
import {IntentClient, ManifestService, MessageClient, MicrofrontendPlatform, OutletRouter, PlatformState} from '@scion/microfrontend-platform';
import {NgZoneIntentClientDecorator, NgZoneMessageClientDecorator} from './ng-zone-decorators';
import {AppDetailsComponent} from './app-details/app-details.component';
import {AppListComponent} from './app-list/app-list.component';
import {SciViewportModule} from '@scion/toolkit/viewport';
import {SciAccordionModule, SciFilterFieldModule, SciFormFieldModule, SciListModule, SciParamsEnterModule, SciPropertyModule, SciTabbarModule} from '@scion/toolkit.internal/widgets';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CapabilityAccordionPanelComponent} from './capability-accordion-panel/capability-accordion-panel.component';
import {CapabilityAccordionItemComponent} from './capability-accordion-item/capability-accordion-item.component';
import {IntentionAccordionPanelComponent} from './intention-accordion-panel/intention-accordion-panel.component';
import {IntentionAccordionItemComponent} from './intention-accordion-item/intention-accordion-item.component';
import {QualifierChipListComponent} from './qualifier-chip-list/qualifier-chip-list.component';
import {SciDimensionModule} from '@scion/toolkit/dimension';
import {FindCapabilitiesComponent} from './find-capabilities/find-capabilities.component';
import {ReactiveFormsModule} from '@angular/forms';
import {SciSashboxModule} from '@scion/toolkit/sashbox';
import {FilterFieldComponent} from './find-capabilities/filter-field/filter-field.component';
import {AppListItemComponent} from './app-list-item/app-list-item.component';
import {CapabilityFilterResultComponent} from './capability-filter-result/capability-filter-result.component';
import {RequiredCapabilitiesComponent} from './required-capabilities/required-capabilities.component';
import {DependentIntentionsComponent} from './dependent-intentions/dependent-intentions.component';
import {AppMenuComponent} from './app-menu/app-menu.component';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {Beans} from '@scion/toolkit/bean-manager';
import {A11yModule} from '@angular/cdk/a11y';
import {AppNamePipe} from './app-name.pipe';
import {CustomParamMetadataPipe} from './custom-param-metadata.pipe';

@NgModule({
  declarations: [
    AppComponent,
    AppMenuComponent,
    AppListComponent,
    AppListItemComponent,
    AppDetailsComponent,
    CapabilityAccordionPanelComponent,
    CapabilityAccordionItemComponent,
    RequiredCapabilitiesComponent,
    IntentionAccordionPanelComponent,
    IntentionAccordionItemComponent,
    DependentIntentionsComponent,
    FindCapabilitiesComponent,
    FilterFieldComponent,
    CapabilityFilterResultComponent,
    QualifierChipListComponent,
    AppNamePipe,
    CustomParamMetadataPipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    A11yModule,
    ClipboardModule,
    AppRoutingModule,
    SciViewportModule,
    SciListModule,
    SciAccordionModule,
    SciFilterFieldModule,
    SciParamsEnterModule,
    SciPropertyModule,
    SciTabbarModule,
    SciDimensionModule,
    SciFormFieldModule,
    SciSashboxModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: providePlatformInitializerFn,
      multi: true,
      deps: [NgZoneMessageClientDecorator, NgZoneIntentClientDecorator, NgZone],
    },
    {provide: MessageClient, useFactory: () => Beans.get(MessageClient)},
    {provide: IntentClient, useFactory: () => Beans.get(IntentClient)},
    {provide: OutletRouter, useFactory: () => Beans.get(OutletRouter)},
    {provide: ManifestService, useFactory: () => Beans.get(ManifestService)},
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}

export function providePlatformInitializerFn(ngZoneMessageClientDecorator: NgZoneMessageClientDecorator, ngZoneIntentClientDecorator: NgZoneIntentClientDecorator, zone: NgZone): () => Promise<void> {
  return (): Promise<void> => {
    if (isRunningStandalone()) {
      return Promise.resolve();
    }

    // Make the platform to run with Angular
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      Beans.registerDecorator(MessageClient, {useValue: ngZoneMessageClientDecorator});
      Beans.registerDecorator(IntentClient, {useValue: ngZoneIntentClientDecorator});
    });

    // Run the microfrontend platform as client app
    return zone.runOutsideAngular(() => MicrofrontendPlatform.connectToHost('devtools'));
  };
}
