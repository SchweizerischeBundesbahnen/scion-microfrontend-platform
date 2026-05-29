import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {routes} from './app.routes';
import {provideMicrofrontendPlatformHost} from './microfrontend-platform-host.provider';
import {provideMicrofrontendPlatformClient} from './microfrontend-platform-client.provider';
import {provideAnimations} from '@angular/platform-browser/animations';

// Only provide zone CD if the polyfill is loaded (see angular.json).
const zoneEnabled = typeof (window as unknown as {Zone: any}).Zone !== 'undefined';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideMicrofrontendPlatformHost(),
    provideMicrofrontendPlatformClient(),
    provideAnimations(),
    zoneEnabled ? provideZoneChangeDetection() : [],
  ],
};
