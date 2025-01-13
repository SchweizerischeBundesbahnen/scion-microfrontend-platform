import {ContextService, IntentClient, ManifestService, MessageClient, OutletRouter, PlatformPropertyService, PreferredSizeService} from '@scion/microfrontend-platform';
import {provideRouter, Routes, withHashLocation} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {bootstrapApplication} from '@angular/platform-browser';
import {Component, CUSTOM_ELEMENTS_SCHEMA, EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';

@Component({selector: 'app-root', template: ''})
class AppComponent {
}

const appRoutes: Routes = [];

// tag::provide-platform-beans-for-dependency-injection[]
bootstrapApplication(AppComponent, {
  providers: [
    provideMicrofrontendPlatformBeans(),
    // other providers skipped ...
  ],
});

/**
 * Provides beans of @scion/microfrontend-platform for DI.
 */
function provideMicrofrontendPlatformBeans(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {provide: MessageClient, useFactory: () => Beans.get(MessageClient)},
    {provide: IntentClient, useFactory: () => Beans.get(IntentClient)},
    {provide: OutletRouter, useFactory: () => Beans.get(OutletRouter)},
    {provide: ManifestService, useFactory: () => Beans.get(ManifestService)},
    {provide: ContextService, useFactory: () => Beans.get(ContextService)},
    {provide: PreferredSizeService, useFactory: () => Beans.get(PreferredSizeService)},
    {provide: PlatformPropertyService, useFactory: () => Beans.get(PlatformPropertyService)},
  ]);
}

// end::provide-platform-beans-for-dependency-injection[]

// tag::configure-hash-based-routing[]
provideRouter(appRoutes, withHashLocation());
// end::configure-hash-based-routing[]

`
// tag::configure-hash-based-routing-set-baseurl[]
{
  "name": "Your App",
  "baseUrl": "#"
}
// end::configure-hash-based-routing-set-baseurl[]
`

// tag::add-custom-elements-schema[]
@Component({
  selector: '...',
  // content skipped ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // required because <sci-router-outlet> is a custom element
})
export class YourComponent {
}

// end::add-custom-elements-schema[]
