import {Component} from '@angular/core';
import {MicrofrontendPlatformClient} from '@scion/microfrontend-platform';
import {provideRouter, Routes, withHashLocation} from '@angular/router';
import {bootstrapApplication} from '@angular/platform-browser';

@Component({selector: 'app-root', template: ''})
class AppComponent {
}

// tag::resolver[]
const appRoutes: Routes = [
  // Declare a component-less, empty-path route that uses a resolver to connect to the host.
  // Child routes are not loaded until connected to the host.
  {
    path: '',
    resolve: { // <1>
      platform: () => MicrofrontendPlatformClient.connect('APP_SYMBOLIC_NAME'), // <2>
    },
    children: [ // <3>
      {
        path: 'microfrontend-1',
        loadComponent: () => import('./microfrontend-1/microfrontend-1.component'),
      },
      {
        path: 'microfrontend-2',
        loadComponent: () => import('./microfrontend-2/microfrontend-2.component'),
      },
    ],
  },
];

// Register the routes in the router.
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withHashLocation()),
  ],
});
// end::resolver[]

// If bootstrapping the Angular application using `NgModule`.
// If bootstrapping the Angular application without `NgModule` by using a standalone application
// root component (since Angular 14),
