import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

class Microfrontend1Component {
}

// tag::routes[]
const routes: Routes = [
  {
    path: 'microfrontend-1',
    loadChildren: () => import('./microfrontend-1.module').then(m => m.Microfrontend1Module), // <1>
  },
  {
    path: 'microfrontend-2',
    loadChildren: () => import('./microfrontend-2.module').then(m => m.Microfrontend2Module), // <2>
  },
  {
    path: 'activator',
    loadChildren: () => import('./activator.module').then(m => m.ActivatorModule), // <3>
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}

// end::routes[]

// tag::microfrontend-1-module[]
@NgModule({
  declarations: [
    Microfrontend1Component,
  ],
  imports: [
    RouterModule.forChild([
      {path: '', component: Microfrontend1Component},
    ]),
  ],
  // ... other metadata omitted
})
export class Microfrontend1Module {
}

// end::microfrontend-1-module[]
