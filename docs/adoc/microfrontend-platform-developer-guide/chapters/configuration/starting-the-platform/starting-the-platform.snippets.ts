import { ApplicationConfig, MicrofrontendPlatform } from '@scion/microfrontend-platform';

{
  // tag::startHost1[]
  const apps: ApplicationConfig[] = [ // <1>
    {
      symbolicName: 'product-catalog-app',
      manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
    },
    // ... and some more micro applications
  ];

  MicrofrontendPlatform.startHost(apps); // <2>
  // end::startHost1[]
}

{
  // tag::startHost2[]
  const apps: ApplicationConfig[] = [
    {
      symbolicName: 'webshop-app', // <1>
      manifestUrl: 'https://webshop.io/manifest.json',
    },
    {
      symbolicName: 'product-catalog-app',
      manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
    },
    // ... and some more micro applications
  ];

  MicrofrontendPlatform.startHost(apps, {symbolicName: 'webshop-app'}); // <2>
  // end::startHost2[]
}

{
  // tag::connectToHost[]
  MicrofrontendPlatform.connectToHost({symbolicName: 'product-catalog-app'});
  // end::connectToHost[]
}
