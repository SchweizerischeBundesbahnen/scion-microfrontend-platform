import {ApplicationConfig} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {routes} from './app.routes';
import {provideMicrofrontendPlatformHost} from './microfrontend-platform-host.provider';
import {provideMicrofrontendPlatformClient} from './microfrontend-platform-client.provider';
import {provideAnimations} from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideMicrofrontendPlatformHost(),
    provideMicrofrontendPlatformClient(),
    provideAnimations(),
  ],
};
