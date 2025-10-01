import {MicrofrontendPlatformHost, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

{
  // tag::dev-tools:register-dev-tools[]
  MicrofrontendPlatformHost.start({
    applications: [
      // register your micro application(s) here

      // register the 'devtools' micro application
      {
        symbolicName: 'devtools',
        manifestUrl: 'https://microfrontend-platform-devtools-<version>.scion.vercel.app/manifest.json',
        intentionCheckDisabled: true,
        scopeCheckDisabled: true,
        capabilityActiveCheckDisabled: true,
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
  Beans.get(OutletRouter).navigate('https://microfrontend-platform-devtools-<version>.scion.vercel.app', {outlet: 'devtools'});
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

`
// tag::dev-tools:color-scheme[]
  const devToolsRouterOutlet: SciRouterOutletElement = document.querySelector('sci-router-outlet'); // <1>
  devToolsRouterOutlet.setContextValue('color-scheme', 'dark'); // <2>
// end::dev-tools:color-scheme[]
`;
