import {ApplicationConfig, MicrofrontendPlatform} from '@scion/microfrontend-platform';

{
  // tag::startHost1[]
  MicrofrontendPlatform.startHost({
    applications: [ // <1>
      {
        symbolicName: 'product-catalog-app',
        manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
      },
      // ... some more micro applications
    ],
  });
  // end::startHost1[]
}

{
  // tag::startHost2[]
  MicrofrontendPlatform.startHost({
    host: {
      manifest: { // <1>
        name: 'Web Shop (Host)',
        capabilities: [
          // capabilities of the host application
        ],
        intentions: [
          // intentions of the host application
        ],
      },
    },
    applications: [ // <2>
      {
        symbolicName: 'product-catalog-app',
        manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
      },
      // ... some more micro applications
    ],
  });
  // end::startHost2[]
}

{
  // tag::connectToHost[]
  MicrofrontendPlatform.connectToHost('product-catalog-app');
  // end::connectToHost[]
}
