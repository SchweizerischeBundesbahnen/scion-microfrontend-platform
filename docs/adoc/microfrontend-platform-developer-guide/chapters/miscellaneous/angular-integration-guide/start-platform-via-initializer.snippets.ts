import {APP_INITIALIZER, Injectable, NgModule, NgZone} from '@angular/core';
import {MicrofrontendPlatform, MicrofrontendPlatformConfig} from '@scion/microfrontend-platform';

// tag::host-app:initializer[]
@Injectable({providedIn: 'root'})
export class PlatformInitializer {

  constructor(private _zone: NgZone) { // <1>
  }

  public init(): Promise<void> {
    const config: MicrofrontendPlatformConfig = ...; // <2>

    // Start the platform outside of the Angular zone.
    return this._zone.runOutsideAngular(() => MicrofrontendPlatform.startHost(config)); // <3>
  }
}

// end::host-app:initializer[]

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
      useFactory: provideConnectToHostFn, // <1>
      deps: [NgZone], // <2>
      multi: true,
    },
  ],
  // ... other metadata omitted
})
export class AppModule {
}

export function provideConnectToHostFn(zone: NgZone): () => Promise<void> {
  return () => zone.runOutsideAngular(() => MicrofrontendPlatform.connectToHost('<SYMBOLIC NAME>')); // <3>
}

// end::micro-app:initializer[]
