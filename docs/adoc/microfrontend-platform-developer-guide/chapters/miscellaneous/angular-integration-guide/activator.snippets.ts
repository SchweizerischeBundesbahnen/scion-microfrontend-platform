import { Inject, Injectable, InjectionToken, Injector, NgModule, Optional } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MicrofrontendPlatform, PlatformState } from '@scion/microfrontend-platform';

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

// tag::activator-services[]
@Injectable()
export class AuthenticatorService {

  constructor() {
    // implement activator logic here
  }
}

@Injectable()
export class MicrofrontendRouter {

  constructor() {
    // implement activator logic here
  }
}

// end::activator-services[]

// tag::activator-module[]
export const ACTIVATOR = new InjectionToken<any[]>('ACTIVATOR'); // <1>

@NgModule({
  providers: [
    {provide: ACTIVATOR, useClass: AuthenticatorService, multi: true}, // <2>
    {provide: ACTIVATOR, useClass: MicrofrontendRouter, multi: true}, // <3>
  ],
  imports: [
    RouterModule.forChild([]), // <4>
  ],
})
export class ActivatorModule {

  constructor(@Optional() @Inject(ACTIVATOR) activators: any[]) { // <5>
  }
}

// end::activator-module[]

export class ActivatorModule {

  // tag::activator-module-using-resolver[]
  constructor(injector: Injector) {
    MicrofrontendPlatform.whenState(PlatformState.Started).then(() => { // <1>
      injector.get(ACTIVATOR, []); // <2>
    });
  }
  // end::activator-module-using-resolver[]
}

// tag::activator-route[]
const routes: Routes = [
  {
    path: 'activator',
    loadChildren: (): any => import('./activator/activator.module').then(m => m.ActivatorModule),
  },
];
// end::activator-route[]
