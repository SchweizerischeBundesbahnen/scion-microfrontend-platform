import {Component, EnvironmentProviders, inject, makeEnvironmentProviders, NgZone, provideAppInitializer} from '@angular/core';
import {MicrofrontendPlatformClient, MicrofrontendPlatformConfig, MicrofrontendPlatformHost, ObservableDecorator} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {Observable} from 'rxjs';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter, Routes, withHashLocation} from '@angular/router';

class NgZoneObservableDecorator implements ObservableDecorator {

  constructor(zone: NgZone) {
  }

  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return source$;
  }
}

@Component({selector: 'app-root', template: ''})
class AppComponent {
}

const appRoutes: Routes = [];

// tag::host-app:startPlatformHost[]
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideMicrofrontendPlatformHost(), // <1>
  ],
});

function provideMicrofrontendPlatformHost(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(startHostFn), // <2>
  ]);
}

/**
 * Starts the SCION Microfrontend Platform in the host application.
 */
function startHostFn(): Promise<void> {
  const zone = inject(NgZone); // <3>
  Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <4>
  const config: MicrofrontendPlatformConfig = {applications: [...]}; // <5>
  return zone.runOutsideAngular(() => MicrofrontendPlatformHost.start(config)); // <6>
}

// end::host-app:startPlatformHost[]

// tag::micro-app:connectToHost[]
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withHashLocation()),
    provideMicrofrontendPlatformClient(), // <1>
  ],
});

function provideMicrofrontendPlatformClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(connectToHostFn), // <2>
  ]);
}

/**
 * Connects to the host application.
 */
function connectToHostFn(): Promise<void> {
  const zone = inject(NgZone); // <3>
  Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <4>
  return zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect('APP_SYMBOLIC_NAME')); // <5>
}

// end::micro-app:connectToHost[]
