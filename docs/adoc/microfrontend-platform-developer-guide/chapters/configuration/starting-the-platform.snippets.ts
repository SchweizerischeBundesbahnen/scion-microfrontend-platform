import {MicrofrontendPlatformClient, MicrofrontendPlatformHost} from '@scion/microfrontend-platform';

async function startHost1() {
  // tag::startHost1[]
  await MicrofrontendPlatformHost.start({
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

async function startHost2() {
  // tag::startHost2[]
  await MicrofrontendPlatformHost.start({
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

async function connect() {
  // tag::connectToHost[]
  await MicrofrontendPlatformClient.connect('product-catalog-app');
  // end::connectToHost[]
}
