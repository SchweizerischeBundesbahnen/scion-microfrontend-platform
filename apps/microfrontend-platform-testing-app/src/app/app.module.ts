/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PlatformInitializer } from './platform-initializer.service';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserOutletsComponent } from './browser-outlets/browser-outlets.component';
import { BrowserOutletComponent } from './browser-outlet/browser-outlet.component';
import { RouterOutletComponent } from './router-outlet/router-outlet.component';
import { RouterOutletSettingsComponent } from './router-outlet-settings/router-outlet-settings.component';
import { RouterOutletContextComponent } from './router-outlet-context/router-outlet-context.component';
import { ConsolePanelComponent } from './console/console-panel.component';
import { OutletRouterComponent } from './outlet-router/outlet-router.component';
import { ContextComponent } from './context/context.component';
import { ContextEntryComponent } from './context-entry/context-entry.component';
import { PublishMessageComponent } from './messaging/publish-message/publish-message.component';
import { ReceiveMessageComponent } from './messaging/receive-message/receive-message.component';
import { MessageListItemComponent } from './messaging/message-list-item/message-list-item.component';
import { RegisterCapabilityComponent } from './manifest/register-capability/register-capability.component';
import { RegisterIntentionComponent } from './manifest/register-intention/register-intention.component';
import { LookupCapabilityComponent } from './manifest/lookup-capability/lookup-capability.component';
import { LookupIntentionComponent } from './manifest/lookup-intention/lookup-intention.component';
import { TopicSubscriberCountPipe } from './messaging/topic-subscriber-count.pipe';
import { MicrofrontendComponent } from './microfrontend/microfrontend.component';
import { ScrollableMicrofrontendComponent } from './scrollable-microfrontend/scrollable-microfrontend.component';
import { PreferredSizeComponent } from './preferred-size/preferred-size.component';
import { PlatformPropertiesComponent } from './platform-properties/platform-properties.component';
import { SciSashboxModule } from '@scion/toolkit/sashbox';
import { SciViewportModule } from '@scion/toolkit/viewport';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { SciAccordionModule, SciCheckboxModule, SciFormFieldModule, SciListModule, SciParamsEnterModule, SciPropertyModule, SciQualifierChipListModule } from '@scion/toolkit.internal/widgets';

@NgModule({
  declarations: [
    AppComponent,
    BrowserOutletsComponent,
    BrowserOutletComponent,
    RouterOutletComponent,
    RouterOutletSettingsComponent,
    RouterOutletContextComponent,
    ConsolePanelComponent,
    OutletRouterComponent,
    ContextComponent,
    ContextEntryComponent,
    PublishMessageComponent,
    ReceiveMessageComponent,
    MessageListItemComponent,
    RegisterCapabilityComponent,
    RegisterIntentionComponent,
    LookupCapabilityComponent,
    LookupIntentionComponent,
    TopicSubscriberCountPipe,
    MicrofrontendComponent,
    ScrollableMicrofrontendComponent,
    PreferredSizeComponent,
    PlatformPropertiesComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    SciSashboxModule,
    SciViewportModule,
    SciListModule,
    SciSashboxModule,
    SciAccordionModule,
    SciCheckboxModule,
    SciFormFieldModule,
    SciParamsEnterModule,
    SciQualifierChipListModule,
    SciPropertyModule,
    OverlayModule,
    A11yModule,
    AppRoutingModule,
  ],
  bootstrap: [
    AppComponent,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: providePlatformInitializerFn,
      deps: [PlatformInitializer],
      multi: true,
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // required because <sci-router-outlet> is a custom element and unknown to Angular
})
export class AppModule {
}

export function providePlatformInitializerFn(initializer: PlatformInitializer): () => Promise<void> {
  return (): Promise<void> => initializer.init();
}
