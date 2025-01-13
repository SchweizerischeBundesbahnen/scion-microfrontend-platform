import {Component} from '@angular/core';
import {provideRouter, Routes, withHashLocation} from '@angular/router';
import {bootstrapApplication} from '@angular/platform-browser';

@Component({selector: 'app-root', template: ''})
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

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withHashLocation()), // <4>
  ],
});
// end::routes[]
