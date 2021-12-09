import {ContextService, IntentClient, ManifestService, MessageClient, OutletRouter} from '@scion/microfrontend-platform';
import {NgZone} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {observeInside} from '@scion/toolkit/operators';

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

// tag::add-custom-elements-schema[]
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

@NgModule({
  // content skipped ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {
}
// end::add-custom-elements-schema[]

const zone: NgZone = undefined;

// tag::synchronize-with-angular-zone-subscription[]
Beans.get(MessageClient).observe$('topic').subscribe(message => {
  console.log(NgZone.isInAngularZone()); // Evaluates to `false`

  zone.run(() => { // <1>
    console.log(NgZone.isInAngularZone()); // Evaluates to `true`
  });
});
// end::synchronize-with-angular-zone-subscription[]

// tag::synchronize-with-angular-zone-observeInside-operator[]
Beans.get(MessageClient).observe$('topic')
  .pipe(observeInside(continueFn => zone.run(continueFn))) // <1>
  .subscribe(message => {
    console.log(NgZone.isInAngularZone()); // Evaluates to `true`
  });
// end::synchronize-with-angular-zone-observeInside-operator[]

