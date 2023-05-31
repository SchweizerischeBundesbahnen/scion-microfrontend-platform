import {NgModule} from '@angular/core';
import {provideRouter, Routes, withHashLocation} from '@angular/router';
import {MicrofrontendPlatform, PlatformState} from '@scion/microfrontend-platform';

`
// tag::activator-capability[]
"capabilities": [
  {
    "type": "activator", // <1>
    "private": false, // <2>
    "properties": {
      "path": "activator" // <3>
    }
  }
]
// end::activator-capability[]
`;

// tag::activator-module[]
@NgModule({}) // <1>
export class ActivatorModule {

  constructor() { // <2>
    // Perform initialization tasks such as installing message handlers.
  }
}

// end::activator-module[]
@NgModule({})
export class ActivatorModule {

  // tag::activator-module-using-resolver[]
  constructor() {
    MicrofrontendPlatform.whenState(PlatformState.Started).then(() => {
      // Perform initialization tasks such as installing message handlers.
    });
  }

  // end::activator-module-using-resolver[]
}

// tag::activator-route[]
const appRoutes: Routes = [
  {
    path: 'activator',
    loadChildren: () => import('./activator/activator.module'),
  },
];
// end::activator-route[]
