import {APP_INITIALIZER, inject, NgModule, NgZone} from '@angular/core';
import {MicrofrontendPlatformClient, MicrofrontendPlatformConfig, MicrofrontendPlatformHost, ObservableDecorator} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {Observable} from 'rxjs';

class NgZoneObservableDecorator implements ObservableDecorator{
  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return source$;
  }
}

// tag::host-app:startPlatformHost[]
@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: providePlatformStartupFn, // <1>
      multi: true,
    },
  ],
  // ... other metadata omitted
})
export class HostAppModule {
}

export function providePlatformStartupFn(): () => Promise<void> {
  const zone = inject(NgZone); // <2>
  return (): Promise<void> => {
    Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <3>
    const config: MicrofrontendPlatformConfig = {applications: [...]}; // <4>
    return zone.runOutsideAngular(() => MicrofrontendPlatformHost.start(config)); // <5>
  };
}

// end::host-app:startPlatformHost[]

// tag::micro-app:connectToHost[]
@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: providePlatformConnectFn, // <1>
      multi: true,
    },
  ],
  // ... other metadata omitted
})
export class MicroAppModule {
}

export function providePlatformConnectFn(): () => Promise<void> {
  const zone = inject(NgZone); // <2>
  return (): Promise<void> => {
    Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <3>
    return zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect('APP_SYMBOLIC_NAME')); // <4>
  };
}

// end::micro-app:connectToHost[]
