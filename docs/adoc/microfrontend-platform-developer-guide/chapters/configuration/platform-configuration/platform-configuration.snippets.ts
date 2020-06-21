import { Beans, MicrofrontendPlatform, PlatformConfig, PlatformConfigLoader, PlatformPropertyService } from '@scion/microfrontend-platform';

{
  // tag::provide-app-array[]
  MicrofrontendPlatform.startHost({  // <1>
    apps: [
      {
        symbolicName: 'product-catalog-app', // <2>
        manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
      },
      {
        symbolicName: 'shopping-cart-app', // <3>
        manifestUrl: 'https://shopping-cart.webshop.io/manifest.json',
      },
      {
        symbolicName: 'checkout-app', // <4>
        manifestUrl: 'https://checkout.webshop.io/manifest.json',
      },
      {
        symbolicName: 'customer-review-app', // <5>
        manifestUrl: 'https://customer-review.webshop.io/manifest.json',
      },
    ],
  });
  // end::provide-app-array[]
}

{
  // tag::provide-platform-config[]
  MicrofrontendPlatform.startHost({
    properties: { // <1>
      auth: {
        realm: 'shopping app',
        url: 'https://sso.webshop.io/auth',
      },
      languages: ['en', 'de', 'fr', 'it'],
    },
    apps: [
      {
        symbolicName: 'product-catalog-app',
        manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
      },
      {
        symbolicName: 'shopping-cart-app',
        manifestUrl: 'https://shopping-cart.webshop.io/manifest.json',
      },
      {
        symbolicName: 'checkout-app',
        manifestUrl: 'https://checkout.webshop.io/manifest.json',
      },
      {
        symbolicName: 'customer-review-app',
        manifestUrl: 'https://customer-review.webshop.io/manifest.json',
      },
    ],
  });
  // end::provide-platform-config[]
}

{
  // tag::create-platform-config-loader[]
  class HttpPlatformConfigLoader implements PlatformConfigLoader {

    public load(): Promise<PlatformConfig> {
      return fetch('http://webshop.io/config').then(response => {
        if (!response.ok) {
          throw Error(`Failed to fetch application config [status=${response.status}]`);
        }
        return response.json()
      });
    }
  }

  // end::create-platform-config-loader[]

  // tag::provide-platform-config-loader[]
  MicrofrontendPlatform.startHost(HttpPlatformConfigLoader);
  // end::provide-platform-config-loader[]
}

{
  // tag::read-platform-properties[]
  const properties = Beans.get(PlatformPropertyService).properties(); // <1>
  const authConfig = Beans.get(PlatformPropertyService).get('auth'); // <2>
  // end::read-platform-properties[]
}

