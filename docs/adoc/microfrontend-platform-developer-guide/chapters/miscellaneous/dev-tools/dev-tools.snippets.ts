import {MicrofrontendPlatform, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

{
  // tag::dev-tools:register-dev-tools[]
  MicrofrontendPlatform.startHost({
    applications: [
      // register your micro application(s) here

      // register the 'devtools' micro application
      {
        symbolicName: 'devtools',
        manifestUrl: 'https://scion-microfrontend-platform-devtools-<version>.vercel.app/assets/manifest.json',
        intentionCheckDisabled: true,
        scopeCheckDisabled: true,
      },
    ],
  });
  // end::dev-tools:register-dev-tools[]
}

`
  // tag::dev-tools:dev-tools-outlet[]
  <sci-router-outlet name="devtools"></sci-router-outlet>
  // end::dev-tools:dev-tools-outlet[]
`;

{
  // tag::dev-tools:integrate-via-url[]
  Beans.get(OutletRouter).navigate('https://scion-microfrontend-platform-devtools-<version>.vercel.app', {outlet: 'devtools'});
  // end::dev-tools:integrate-via-url[]
}

{
  // tag::dev-tools:integrate-via-intent[]
  Beans.get(OutletRouter).navigate({component: 'devtools', vendor: 'scion'}, {outlet: 'devtools'});
  // end::dev-tools:integrate-via-intent[]
}

`
// tag::dev-tools:intention-declaration[]
{
  "type": "microfrontend",
  "qualifier": {
    "component": "devtools",
    "vendor": "scion"
  }
}
// end::dev-tools:intention-declaration[]
`;
