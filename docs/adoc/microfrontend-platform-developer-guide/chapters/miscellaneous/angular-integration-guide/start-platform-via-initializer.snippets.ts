import {Component, EnvironmentProviders, makeEnvironmentProviders, provideAppInitializer} from '@angular/core';
import {MicrofrontendPlatformClient, MicrofrontendPlatformConfig, MicrofrontendPlatformHost} from '@scion/microfrontend-platform';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter, Routes, withHashLocation} from '@angular/router';

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
  const config: MicrofrontendPlatformConfig = {applications: [...]}; // <3>
  return MicrofrontendPlatformHost.start(config); // <4>
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
  return MicrofrontendPlatformClient.connect('APP_SYMBOLIC_NAME'); // <3>
}

// end::micro-app:connectToHost[]
