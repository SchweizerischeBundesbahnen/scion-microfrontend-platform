import { APP_INITIALIZER, Injectable, NgModule } from '@angular/core';
import { Beans, MicrofrontendPlatform, PlatformConfig, PlatformConfigLoader, PlatformState, PlatformStates } from '@scion/microfrontend-platform';
import { HttpClient } from '@angular/common/http';

// tag::host-app:initializer[]
@Injectable({providedIn: 'root'})
export class PlatformInitializer {

  constructor(private httpClient: HttpClient) { // <1>
  }

  public init(): Promise<void> {
    // Initialize the platform to run with Angular.
    Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
      Beans.register(HttpClient, {useValue: this.httpClient}); // <2>
    });

    // Start the platform in host-mode.
    return MicrofrontendPlatform.startHost(HttpPlatformConfigLoader); // <3>
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
    },
  ],
  // ... other metadata omitted
})
export class MicroAppModule {
}

export function provideMicroAppPlatformInitializerFn(): () => Promise<void> {
  return () => MicrofrontendPlatform.connectToHost({symbolicName: 'product-catalog-app'}); // <1>
}
// end::micro-app:initializer[]
