import {DOCUMENT, EnvironmentProviders, inject, makeEnvironmentProviders} from '@angular/core';
import {ContextService} from '@scion/microfrontend-platform';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {provideMicrofrontendPlatformClientInitializer} from '../microfrontend-platform-client/microfrontend-platform-client-initializer';

/**
 * Switches the theme based on the color scheme of the embedding context, applying 'scion-dark' theme for a dark color scheme
 * and 'scion-light' for a light color scheme.
 */
function installThemeSwitcher(): void {
  const contextService = inject(ContextService);
  const documentRoot = inject(DOCUMENT).documentElement;

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

/**
 * Registers a set of DI providers to set up the DevTools theme.
 */
export function provideTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideMicrofrontendPlatformClientInitializer(() => installThemeSwitcher()),
  ]);
}
