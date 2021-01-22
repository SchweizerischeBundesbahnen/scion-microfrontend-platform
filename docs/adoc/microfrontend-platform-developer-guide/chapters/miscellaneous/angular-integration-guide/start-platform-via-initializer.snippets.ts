import { APP_INITIALIZER, Injectable, NgModule, NgZone } from '@angular/core';
import { MicrofrontendPlatform, PlatformConfig, PlatformConfigLoader, PlatformState } from '@scion/microfrontend-platform';
import { HttpClient } from '@angular/common/http';
import { Beans } from '@scion/toolkit/bean-manager';

// tag::host-app:initializer[]
@Injectable({providedIn: 'root'})
export class PlatformInitializer {

  constructor(private _httpClient: HttpClient, private _zone: NgZone) { // <1>
  }

  public init(): Promise<void> {
    // Initialize the platform to run with Angular.
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      Beans.register(HttpClient, {useValue: this._httpClient}); // <2>
    });

    // Start the platform in host-mode.
    return this._zone.runOutsideAngular(() => MicrofrontendPlatform.startHost(HttpPlatformConfigLoader)); // <3>
  }
}

// end::host-app:initializer[]

// tag::host-app:platform-config-loader[]
export class HttpPlatformConfigLoader implements PlatformConfigLoader {
  public load(): Promise<PlatformConfig> {
    return Beans.get(HttpClient).get<PlatformConfig>('assets/platform-config.json').toPromise(); // <1>
  }
}
// end::host-app:platform-config-loader[]

// tag::host-app:register-initializer[]
@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: providePlatformInitializerFn, // <1>
      deps: [PlatformInitializer], // <2>
      multi: true,
    },
  ],
  // ... other metadata omitted
})
export class AppModule {
}

export function providePlatformInitializerFn(initializer: PlatformInitializer): () => Promise<void> {
  return (): Promise<void> => initializer.init(); // <3>
}
// end::host-app:register-initializer[]

// tag::micro-app:initializer[]
@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: provideMicroAppPlatformInitializerFn,
      multi: true,
      deps: [NgZone],
    },
  ],
  // ... other metadata omitted
})
export class MicroAppModule {
}

export function provideMicroAppPlatformInitializerFn(zone: NgZone): () => Promise<void> {
  return () => zone.runOutsideAngular(() => MicrofrontendPlatform.connectToHost({symbolicName: 'product-catalog-app'})); // <1>
}
// end::micro-app:initializer[]
