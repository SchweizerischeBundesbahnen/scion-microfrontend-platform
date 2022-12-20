import {inject, NgModule, NgZone} from '@angular/core';
import {MicrofrontendPlatformClient, ObservableDecorator} from '@scion/microfrontend-platform';
import {RouterModule, Routes} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {Observable} from 'rxjs';

class NgZoneObservableDecorator implements ObservableDecorator{
  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return source$;
  }
}

class Microfrontend1Component {
}

class Microfrontend2Component {
}

// tag::resolver[]
const routes: Routes = [
  {
    path: '',
    resolve: { // <1>
      platform: () => {
        const zone = inject(NgZone); // <2>
        Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <3>
        return zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect('APP_SYMBOLIC_NAME')); // <4>
      },
    },
    children: [ // <5>
      {
        path: 'microfrontend-1',
        loadChildren: () => import('./microfrontend-1.module').then(m => m.Microfrontend1Module),
      },
      {
        path: 'microfrontend-2',
        loadChildren: () => import('./microfrontend-2.module').then(m => m.Microfrontend1Module),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}

// end::resolver[]
