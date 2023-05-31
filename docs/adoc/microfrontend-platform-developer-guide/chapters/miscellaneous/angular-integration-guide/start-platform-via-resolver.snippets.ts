import {Component, inject, NgZone} from '@angular/core';
import {MicrofrontendPlatformClient, ObservableDecorator} from '@scion/microfrontend-platform';
import {provideRouter, Routes, withHashLocation} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {Observable} from 'rxjs';
import {bootstrapApplication} from '@angular/platform-browser';

@Component({selector: 'app-root', template: '', standalone: true})
class AppComponent {
}

class NgZoneObservableDecorator implements ObservableDecorator {

  constructor(zone: NgZone) {
  }
  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return source$;
  }
}

// tag::resolver[]
const appRoutes: Routes = [
  // Declare a component-less, empty-path route that uses a resolver to connect to the host.
  // Child routes are not loaded until connected to the host.
  {
    path: '',
    resolve: { // <1>
      platform: () => {
        const zone = inject(NgZone); // <2>
        Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <3>
        return zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect('APP_SYMBOLIC_NAME')); // <4>
      },
    },
    children: [ // <5>
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
