<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Navigating via Intent

In the previous chapter, we embedded the *ProductList Microfrontend* in the *Customer Microfrontend* by passing the URL of the products page to the router. This way of integration is simple and straightforward, but also has its drawbacks. For example, you need to know the URL of embedded content, the microfrontend URL becomes public API, and embedded content does not know its integrators.

That's why the SCION Microfrontend Platform features the Intention API, which enables controlled collaboration between micro apps. It is inspired by the Android platform where an application can start an activity via an *Intent* (such as sending an email). To collaborate, an application must express an *Intention*, making interaction flows explicit, which is especially important for cross-application communication and navigation.

Let us introduce you to the terminology of the Intention API.

### Terminology of the Intention API
- **Capabilty** \
  A capability represents some functionality of a micro app that is available to qualified micro apps through the Intention API. A micro app declares its capabilities in its manifest. Qualified micro apps can browse capabilities similar to a catalog, or interact with capabilities via intent. \
  A capability is formulated in an abstract way consisting of a `type` and optionally a `qualifier`. The type categorizes a capability in terms of its functional semantics (e.g., `microfrontend` if providing a microfrontend). Multiple capabilities can be of the same type. In addition to the type, a capability can define a qualifier to differentiate the different capabilities of the same type.

- **Intention** \
  An intention refers to one or more capabilities that a micro app wants to interact with. A micro app declares its intentions in its manifest. Manifesting intentions enables us to see dependencies between applications down to the functional level.

- **Intent** \
  The intent is the message that a micro app sends to interact with functionality that is available in the form of a capability. If the application has not declared a respective intention in its manifest, the message will be rejected.

- **Qualifier** \
  The qualifier is a dictionary of arbitrary key-value pairs to differentiate capabilities of the same type. \
  To better understand the concept of the qualifier, a bean manager can be used as an analogy. If there is more than one bean of the same type, a qualifier can be used to control which bean to inject.


For more information on the concepts and usage of the Intention API, please refer to our developer guide:
- [Intention API][link-getting-started:developer-guide:intention-api]
- [Intent-based Routing][link-getting-started:developer-guide:intent-based-routing]
- [Intent-based Messaging][link-getting-started:developer-guide:intent-based-messaging].

In this chapter, we will refactor our application to navigate via intent instead of the URL.

***

<details>
  <summary><strong>Embed the *ProductList Microfrontend* via intent</strong></summary>

In this section, we will migrate the embedding of the *ProductList Microfrontend* in the *Customer Microfrontend* from url-based to intent-based navigation.

<details>
  <summary><strong>Provide the *ProductList Microfrontend* as microfrontend capability</strong></summary>

In order to navigate via intent, we need to provide the *ProductList Microfrontend* as `microfrontend` capability.

1. Open the manifest `products-app/src/manifest.json` of the *Products App*.
2. Register the *ProductList Microfrontend* as `microfrontend` capability, as follows:
   ```txt
          {
            "name": "Products App",
      [+]   "capabilities": [
      [+]     {
      [+]       "type": "microfrontend",
      [+]       "qualifier": {
      [+]         "entity": "products"
      [+]       },
      [+]       "params": [
      [+]         {
      [+]           "name": "ids",
      [+]           "required": false
      [+]         }
      [+]       ],
      [+]       "private": false,
      [+]       "properties": {
      [+]         "path": "/product-list/product-list.html#?ids=:ids"
      [+]       }
      [+]     }
      [+]   ]
          }
   ```
   - `type`: \
     Categorizes the capability as a microfrontend. 
   - `qualifier`: \
     Qualifies the microfrontend capability, allows navigating to this microfrontend using the qualifier `{entity: 'products'}`. 
   - `params`: \
     Declares optional and required parameter(s) of this capability. Required parameters must be passed when navigating to this microfrontend. Parameters can be referenced in the path in the form of named parameters using the colon syntax (`:`). 
     <br>
     By passing this parameter the navigator can control which products to display.
   - `private`: \
     If set to `false`, makes this a public microfrontend, allowing other micro apps to navigate to this microfrontend. By default, capabilities have *application-private* scope.
   - `properties`: \
     Section to associate metadata with a capability.
   - `path`: \
     Metadata specific to the `microfrontend` capability to specify the path to the microfrontend.
     <br>
     The path is relative to the application’s base URL. In the path, you can reference qualifier and parameter values in the form of named parameters. Named parameters begin with a colon (`:`) followed by the parameter or qualifier name, and are allowed in path segments, query parameters, matrix parameters and the fragment part. The router will substitute named parameters in the URL accordingly.
</details>

<details>
  <summary><strong>Declare microfrontend intention in the *Customers App*</strong></summary>

In order to navigate to another application's microfrontend, the navigating app must manifest an intention. If not declaring the intention, the navigation will be rejected.

1. Open the manifest `customers-app/src/manifest.json` of the *Customers App*.
2. Declare the `microfrontend` intention as follows:
   ```txt
          {
            "name": "Customers App",
      [+]   "intentions": [
      [+]     {
      [+]       "type": "microfrontend",
      [+]       "qualifier": {
      [+]         "entity": "products"
      [+]       }
      [+]     }
      [+]   ]
          }
   ```
   The intention qualifier allows using wildcards (such as `*` or `?`) to match multiple capabilities simultaneously.
</details>

<details>
  <summary><strong>Navigate via intent instead of the URL</strong></summary>

In the *Customer Microfrontend*, we can now embed the *ProductList Microfrontend* without having to know its URL, as follows:

1. Open the file `customers-app/src/customer/customer.ts`
2. Replace the url-based navigation with intent-based navigation, as follows:

   **Before:**
   ```ts
   // Display the products purchased by the customer
   Beans.get(OutletRouter).navigate('http://localhost:4201/product-list/product-list.html#?ids=:ids', {
     params: {ids: customer.productIds},
     outlet: 'customer-products',
   });   
   ```

   **After:**
   ```ts
   // Display the products purchased by the customer
   Beans.get(OutletRouter).navigate({entity: 'products'}, {
     params: new Map().set('ids', customer.productIds),
     outlet: 'customer-products',
   });
   ```
  
  Instead of the URL, pass the router the qualifier of the *ProductList Microfrontend* and the parameters declared by the capability via options object. If the `microfrontend` capability declares required parameters and we do not pass them, navigation is rejected.

</details>

</details>

***

<details>
  <summary><strong>Open the *Product Microfrontend* via intent</strong></summary>

In this section, we will migrate the navigation to the *Product Microfrontend* from url-based to intent-based navigation.

<details>
  <summary><strong>Provide the *Product Microfrontend* as microfrontend capability</strong></summary>

In order to navigate via intent, we need to provide the *Product Microfrontend* as `microfrontend` capability.

1. Open the manifest `products-app/src/manifest.json` of the *Products App*.
2. Register the *Product Microfrontend* as `microfrontend` capability, as follows:
   ```txt
          {
            "name": "Products App",
            "capabilities": [
              {
                "type": "microfrontend",
                "qualifier": {
                  "entity": "products"
                },
                "params": [
                  {
                    "name": "ids",
                    "required": false
                  }
                ],
                "private": false,
                "properties": {
                  "path": "/product-list/product-list.html#?ids=:ids"
                }
              },
      [+]     {
      [+]       "type": "microfrontend",
      [+]       "qualifier": {
      [+]         "entity": "product"
      [+]       },
      [+]       "params": [
      [+]         {
      [+]           "name": "id",
      [+]           "required": true
      [+]         }
      [+]       ],
      [+]       "private": true,
      [+]       "properties": {
      [+]         "path": "/product/product.html#?id=:id",
      [+]         "outlet": "aside"
      [+]       }
      [+]     }
            ]
          }
   ```
   Explanation:
   - `params`: \
     This microfrontend requires the navigator to pass the ID of the product to be displayed. For that reason, we declare `id` as required parameter.
   - `private`: \
     We make this an application-private `microfrontend` capability that can only be navigated to from the *Products App*. By default, capabilities are private to the providing application.
   - `outlet`: \
     The `microfrontend` capability allow us to specify the preferred outlet into which to load the microfrontend. Note that this outlet preference is only a hint that will be ignored if the navigator specifies an outlet for navigation.
</details>

<details>
  <summary><strong>Navigate via intent instead of the URL</strong></summary>

In the *ProductList Microfrontend*, we can now navigate to the *Product Microfrontend* without having to know its URL, as follows:

1. Open the file `products-app/src/product-list/product-list.ts`
2. In the `render` method, Replace the url-based navigation with intent-based navigation, as follows:

   **Before:**
   ```ts
   productLink.addEventListener('click', () => {
     Beans.get(OutletRouter).navigate(`/product/product.html#?id=${product.id}`, {outlet: 'aside'});
   });
   ```

   **After:**
   ```ts
   productLink.addEventListener('click', () => {
     Beans.get(OutletRouter).navigate({entity: 'product'}, {params: new Map().set('id', product.id)});
   });
   ```

   Note that we do not specify the outlet because it is already specified as a preference in the microfrontend capability. We also do not need to declare an intention in our manifest, since we are opening a microfrontend provided by the navigating application. An application is implicitly qualified to interact with its own capabilities.  
   
</details>
</details>

***

<details>
  <summary><strong>Open the *Customer Microfrontend* via intent</strong></summary>

In this section, we will migrate the navigation to the *Customer Microfrontend* from url-based to intent-based navigation.

<details>
  <summary><strong>Provide the *Customer Microfrontend* as microfrontend capability</strong></summary>

In order to navigate via intent, we need to provide the *Customer Microfrontend* as `microfrontend` capability.

1. Open the manifest `customers-app/src/manifest.json` of the *Customers App*.
2. Register the *Customer Microfrontend* as `microfrontend` capability, as follows:
   ```txt
          {
            "name": "Customers App",
   [+]      "capabilities": [
   [+]        {
   [+]          "type": "microfrontend",
   [+]          "qualifier": {
   [+]            "entity": "customer"
   [+]          },
   [+]          "params": [
   [+]            {
   [+]              "name": "id",
   [+]              "required": true
   [+]            }
   [+]          ],
   [+]          "properties": {
   [+]            "path": "/customer/customer.html#?id=:id",
   [+]            "outlet": "aside"
   [+]          }
   [+]        }
   [+]      ],
            "intentions": [
              {
                "type": "microfrontend",
                "qualifier": {
                  "entity": "products"
                }
              }
            ]
          }
   ```
   Explanation:
  - `params`: \
    This microfrontend requires the navigator to pass the ID of the customer to be displayed. For that reason, we declare `id` as required parameter.
  - `private`: \
    We make this an application-private `microfrontend` capability that can only be navigated to from the *Customers App*. By default, capabilities are private to the providing application.
  - `outlet`: \
    The `microfrontend` capability allow us to specify the preferred outlet into which to load the microfrontend. Note that this outlet preference is only a hint that will be ignored if the navigator specifies an outlet for navigation.
</details>

<details>
  <summary><strong>Navigate via intent instead of the URL</strong></summary>

In the *CustomerList Microfrontend*, we can now navigate to the *Customer Microfrontend* without having to know its URL, as follows:

1. Open the file `customers-app/src/customer-list/customer-list.ts`
2. In the `render` method, Replace the url-based navigation with intent-based navigation, as follows:

   **Before:**
   ```ts
   customerLink.addEventListener('click', () => {
     Beans.get(OutletRouter).navigate(`/customer/customer.html#?id=${customer.id}`, {outlet: 'aside'});
   });
   ```

   **After:**
   ```ts
   customerLink.addEventListener('click', () => {
     Beans.get(OutletRouter).navigate({entity: 'customer'}, {params: new Map().set('id', customer.id)});
   });
   ```

   Note that we do not specify the outlet because it is already specified as a preference in the microfrontend capability. We also do not need to declare an intention in our manifest, since we are opening a microfrontend provided by the navigating application. An application is implicitly qualified to interact with its own capabilities.  
   
</details>

</details>

***

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications and see that the microfrontends are displayed as before the refactoring.

</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

In this chapter, we learned about the Intention API to navigate without having to know the URL.

<details>
   <summary>The <code>products-app/src/manifest.json</code> looks as following:</summary>

```json
{
  "name": "Products App",
  "capabilities": [
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "products"
      },
      "params": [
        {
          "name": "ids",
          "required": false
        }
      ],
      "private": false,
      "properties": {
        "path": "/product-list/product-list.html#?ids=:ids"
      }
    },
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "product"
      },
      "params": [
        {
          "name": "id",
          "required": true
        }
      ],
      "properties": {
        "path": "/product/product.html#?id=:id",
        "outlet": "aside"
      }
    }
  ]
}
```
</details>

<details>
   <summary>The <code>products-app/src/product-list/product-list.ts</code> looks as following:</summary>

```ts
import {ProductService} from '../product.service';
import {QueryParams} from '../query-params';
import {MicrofrontendPlatformClient, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

class ProductListController {

  public async init(): Promise<void> {
    await MicrofrontendPlatformClient.connect('products-app');
    QueryParams.observe$.subscribe(queryParams => {
      const productIds = queryParams.get('ids')?.split(',');
      this.render(productIds);
    });
  }

  public render(ids?: string[]): void {
    const productsSection = document.querySelector('section#products');
    productsSection.innerHTML = null;

    ProductService.INSTANCE.getProducts({ids}).forEach(product => {
      // Product Name
      const productLink = productsSection.appendChild(document.createElement('a'));
      productLink.innerText = product.name;
      productLink.addEventListener('click', () => {
        Beans.get(OutletRouter).navigate({entity: 'product'}, {params: new Map().set('id', product.id)});
      });

      // Product Price
      productsSection.appendChild(document.createTextNode(`$ ${product.price.toFixed(2)}`));
    });
  }
}

new ProductListController().init();
```
</details>

<details>
   <summary>The <code>customers-app/src/manifest.json</code> looks as following:</summary>

```json
{
  "name": "Customers App",
  "capabilities": [
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "customer"
      },
      "params": [
        {
          "name": "id",
          "required": true
        }
      ],
      "properties": {
        "path": "/customer/customer.html#?id=:id",
        "outlet": "aside"
      }
    }
  ],
  "intentions": [
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "products"
      }
    }
  ]
}
```
</details>

<details>
   <summary>The <code>customers-app/src/customer-list/customer-list.ts</code> looks as following:</summary>

```ts
import {CustomerService} from '../customer.service';
import {MicrofrontendPlatformClient, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

class CustomerListController {

  public async init(): Promise<void> {
    await MicrofrontendPlatformClient.connect('customers-app');
    this.render();
  }

  public render(): void {
    const customersSection = document.querySelector('section#customers');

    CustomerService.INSTANCE.getCustomers().forEach(customer => {
      // Customer Link
      const customerLink = customersSection.appendChild(document.createElement('a'));
      customerLink.innerText = `${customer.firstname} ${customer.lastname}`;
      customerLink.addEventListener('click', () => {
        Beans.get(OutletRouter).navigate({entity: 'customer'}, {params: new Map().set('id', customer.id)});
      });

      // City
      customersSection.appendChild(document.createTextNode(customer.city));
    });
  }
}

new CustomerListController().init();

```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>

   In the next chapter, we will integrate the SCION DevTools to inspect integrated micro apps, browse capabilities and analyze dependencies between micro apps. Click [here][link-getting-started:07:devtools] to continue. 
</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[menu-getting-started]: /docs/site/getting-started/getting-started.md
[link-getting-started:01:host-app]: 01-getting-started-host-app.md
[link-getting-started:02:products-app]: 02-getting-started-products-app.md
[link-getting-started:03:customers-app]: 03-getting-started-customers-app.md
[link-getting-started:04:microfrontend-routing]: 04-getting-started-microfrontend-routing.md
[link-getting-started:05:embed-microfrontend]: 05-getting-started-embed-microfrontend.md
[link-getting-started:06:navigate-via-intent]: 06-getting-started-navigate-via-intent.md
[link-getting-started:07:devtools]: 07-getting-started-devtools.md
[link-getting-started:08:browse-capabilities]: 08-getting-started-browse-capabilities.md
[link-getting-started:09:summary]: 09-getting-started-summary.md

[link-getting-started:developer-guide:intention-api]: https://microfrontend-platform-developer-guide.scion.vercel.app/#chapter:intention-api
[link-getting-started:developer-guide:intent-based-routing]: https://microfrontend-platform-developer-guide.scion.vercel.app/#chapter:outlet-router:navigation-via-intent
[link-getting-started:developer-guide:intent-based-messaging]: https://microfrontend-platform-developer-guide.scion.vercel.app/#chapter:intent-based-messaging
