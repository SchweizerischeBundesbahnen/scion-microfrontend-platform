import {ContextService, IntentClient, ManifestService, MessageClient, OutletRouter} from '@scion/microfrontend-platform';
import {RouterModule, Routes} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';

// tag::provide-platform-beans-for-dependency-injection[]
@NgModule({
  providers: [
    {provide: MessageClient, useFactory: () => Beans.get(MessageClient)},
    {provide: IntentClient, useFactory: () => Beans.get(IntentClient)},
    {provide: OutletRouter, useFactory: () => Beans.get(OutletRouter)},
    {provide: ContextService, useFactory: () => Beans.get(ContextService)},
    {provide: ManifestService, useFactory: () => Beans.get(ManifestService)},
  ],
  // ... other metadata omitted
})
export class AppModule {
}

// end::provide-platform-beans-for-dependency-injection[]

const routes: Routes = [];

// tag::configure-hash-based-routing[]
RouterModule.forRoot(routes, {useHash: true});
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
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

@NgModule({
  // content skipped ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {
}
// end::add-custom-elements-schema[]
