import {ApplicationConfig} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {routes} from './app.routes';
import {provideMicrofrontendPlatformClient} from './microfrontend-platform-client/microfrontend-platform-client.provider';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideTheme} from './theme/theme-switcher.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideMicrofrontendPlatformClient(),
    provideTheme(),
    provideAnimations(),
  ],
};
