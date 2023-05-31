import {Component, EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {Routes} from '@angular/router';

@Component({selector: 'app-root', template: '', standalone: true})
class AppComponent {
}

// tag::routes[]
const appRoutes: Routes = [
  {
    path: 'activator',
    loadChildren: () => import('./activator/activator.module'), // <1>
  },
  {
    path: 'microfrontend-1',
    loadComponent: () => import('./microfrontend-1/microfrontend-1.component'), // <2>
  },
  {
    path: 'microfrontend-2',
    loadComponent: () => import('./microfrontend-2/microfrontend-2.component'), // <3>
  },
];

// end::routes[]

function provideMicrofrontendPlatformClient(): EnvironmentProviders {
  return makeEnvironmentProviders([]);
}
