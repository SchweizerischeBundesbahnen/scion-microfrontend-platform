import {EnvironmentProviders, inject, Injectable, makeEnvironmentProviders} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ContextService} from '@scion/microfrontend-platform';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MICROFRONTEND_PLATFORM_POST_CONNECT} from '../microfrontend-platform-client/microfrontend-platform-client.provider';

/**
 * Subscribes to the color scheme of the embedding context, applying 'scion-dark' theme for a dark color scheme
 * or 'scion-light' for a light color scheme.
 */
@Injectable(/* DO NOT PROVIDE via 'providedIn' metadata registered via APP_INITIALIZER. */)
class ThemeSwitcher {

  constructor(contextService: ContextService) {
    const documentRoot = inject<Document>(DOCUMENT).documentElement;

    contextService.observe$<'light' | 'dark' | null>('color-scheme')
      .pipe(takeUntilDestroyed())
      .subscribe(colorScheme => {
        if (colorScheme) {
          documentRoot.setAttribute('sci-theme', colorScheme === 'dark' ? 'scion-dark' : 'scion-light');
        }
        else {
          documentRoot.removeAttribute('sci-theme');
        }
      });
  }
}

/**
 * Registers a set of DI providers to set up the DevTools theme.
 */
export function provideTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {provide: MICROFRONTEND_PLATFORM_POST_CONNECT, useClass: ThemeSwitcher, multi: true},
  ]);
}
