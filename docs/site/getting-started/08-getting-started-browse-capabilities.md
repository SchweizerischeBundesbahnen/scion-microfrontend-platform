<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Browse Catalog of Capabilities

In this chapter, we will browse the catalog of capabilities to dynamically construct the top-level navigation.

<details>
  <summary><strong>Prepare the microfrontends for contributing to the navigation bar</strong></summary>

In [chapter 6][link-getting-started:06:navigate-via-intent], we already provided the *ProductList Microfrontend* as microfrontend capability. We now need to do the same for the *CustomerList Microfrontend*.

1. Open the manifest `customers-app/src/manifest.json` of the *Customers App*.
2. Register the *CustomerList Microfrontend* as `microfrontend` capability, as follows:
   ```txt
        {
          "name": "Customers App",
          "capabilities": [
   [+]      {
   [+]        "type": "microfrontend",
   [+]        "qualifier": {
   [+]          "entity": "customers"
   [+]        },
   [+]        "private": false,
   [+]        "properties": {
   [+]          "path": "/customer-list/customer-list.html",
   [+]          "navbar": {
   [+]            "label": "Customers"
   [+]          }
   [+]        }
   [+]      },
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

   Note that we set the custom property `navbar` in the properties section of the capability. We will read this property when filtering the catalog of capabilities to determine for which microfrontends to create a navbar item.
3. Open the manifest `products-app/src/manifest.json` of the *Products App* and add the property `navbar` to the `ProductList Microfrontend`, as follows:
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
                "path": "/product-list/product-list.html#?ids=:ids",
   [+]          "navbar": {
   [+]            "label": "Products"
   [+]          }
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
  <summary><strong>Declare intention to browse microfrontend capabilities</strong></summary>

In order for the host app to browse and navigate to microfrontend capabilities, we need to declare an intention, as follows:

1. Open the file `host-app/src/host.ts`.
2. Declare a microfrontend wildcard intention, as follows:
   ```ts
        await MicrofrontendPlatformHost.start({
          applications: [
            {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
            {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
            {
              symbolicName: 'devtools',
              manifestUrl: 'https://scion-microfrontend-platform-devtools.vercel.app/assets/manifest.json',
              intentionCheckDisabled: true,
              scopeCheckDisabled: true,
            },
          ],
          host: {
            manifest: {
              name: 'Host App',
              intentions: [
                {type: 'microfrontend', qualifier: {component: 'devtools', vendor: 'scion'}},
   [+]          {type: 'microfrontend', qualifier: {'*': '*'}},
              ],
            },
          },
        });
   ```

</details>

<details>
  <summary><strong>Remove static navigation buttons</strong></summary>

1. Open the file `host-app/src/index.html` of the host app.
2. Remove the buttons in the `<nav>` element, as follows:
 
   **Before:**
   ```html
    <nav>
      <button id="products">Products</button>
      <button id="customers">Customers</button>
    </nav>
   ```
   **After:**
   ```html
   <nav></nav>
   ```
4. Open the file `host-app/src/host.ts` of the host app.
5. Remove the event listeners of the static buttons we removed in the previous step.
</details>

<details>
  <summary><strong>Populate the navigation bar</strong></summary>

1. Open the file `host-app/src/host.ts` of the host app.
2. Create a button for each of the microfrontend capabilities to be added to the navigation bar, as follows:
  ```ts
  [+]   import {ManifestService, MicrofrontendPlatformHost, OutletRouter} from '@scion/microfrontend-platform';
        import {Beans} from '@scion/toolkit/bean-manager';
  [+]   import {filterArray} from '@scion/toolkit/operators';

        public async init(): Promise<void> {
          await MicrofrontendPlatformHost.start({
            applications: [
              {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
              {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
              {
                symbolicName: 'devtools',
                manifestUrl: 'https://scion-microfrontend-platform-devtools.vercel.app/assets/manifest.json',
                intentionCheckDisabled: true,
                scopeCheckDisabled: true,
              },
            ],
            host: {
              manifest: {
                name: 'Host App',
                intentions: [
                  {type: 'microfrontend', qualifier: {component: 'devtools', vendor: 'scion'}},
                  {type: 'microfrontend', qualifier: {'*': '*'}},
                ],
              },
            },
          });
      
          // Display the DevTools
          Beans.get(OutletRouter).navigate({component: 'devtools', vendor: 'scion'}, {outlet: 'bottom'});

  [+]     // Create a navigation button for each of the microfrontend capabilities to be added to the navigation bar
  [+]     const navbar = document.querySelector('nav');
  [+]     Beans.get(ManifestService).lookupCapabilities$({type: 'microfrontend'})
  [+]       .pipe(filterArray(capability => capability.properties.navbar))
  [+]       .subscribe(capabilities => {
  [+]         navbar.innerHTML = null;
  [+]         capabilities.forEach(capability => {
  [+]           const menuItem = navbar.appendChild(document.createElement('button'));
  [+]           menuItem.innerText = capability.properties.navbar.label;
  [+]           menuItem.addEventListener('click', () => {
  [+]             Beans.get(OutletRouter).navigate(capability.qualifier);
  [+]           });
  [+]         })
  [+]       });
  ```
  Using the `ManifestServie`, we can browse the catalog of capabilities and pass a filter to return only the capabilities that are of interest to us. We further filter capabilities having the `navbar` property. For each of these capabilities, we create a button that, when clicked, navigates to the microfrontend of that qualifier.
</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications and see that the navigation buttons are now contributed via capabilities.

</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

In this chapter, we learned how to browse the catalog of capabilities to dynamically populate the navigation bar.

<details>
   <summary>The <code>customers-app/src/manifest.json</code> looks as following:</summary>

```json
{
  "name": "Customers App",
  "capabilities": [
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "customers"
      },
      "private": false,
      "properties": {
        "path": "/customer-list/customer-list.html",
        "navbar": {
          "label": "Customers"
        }
      }
    },
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
        "path": "/product-list/product-list.html#?ids=:ids",
        "navbar": {
          "label": "Products"
        }
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
      "private": true,
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
   <summary>The <code>host-app/src/index.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Getting Started with SCION</title>
    <link rel="stylesheet" type="text/css" href="host.scss">
    <script type="module" src="./host.ts"></script>
  </head>
  <body>
    <nav></nav>
    <main>
      <sci-router-outlet></sci-router-outlet>
      <sci-router-outlet name="aside"></sci-router-outlet>
      <sci-router-outlet name="bottom"></sci-router-outlet>
    </main>
  </body>
</html>
```
</details>

<details>
   <summary>The <code>host-app/src/host.ts</code> looks as following:</summary>

```ts
import {ManifestService, MicrofrontendPlatformHost, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {filterArray} from '@scion/toolkit/operators';

class HostController {

  public async init(): Promise<void> {
    await MicrofrontendPlatformHost.start({
      applications: [
        {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
        {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
        {
          symbolicName: 'devtools',
          manifestUrl: 'https://scion-microfrontend-platform-devtools.vercel.app/assets/manifest.json',
          intentionCheckDisabled: true,
          scopeCheckDisabled: true,
        },
      ],
      host: {
        manifest: {
          name: 'Host App',
          intentions: [
            {type: 'microfrontend', qualifier: {component: 'devtools', vendor: 'scion'}},
            {type: 'microfrontend', qualifier: {'*': '*'}},
          ],
        },
      },
    });

    // Display the DevTools
    Beans.get(OutletRouter).navigate({component: 'devtools', vendor: 'scion'}, {outlet: 'bottom'});

    // Create a navigation button for each of the microfrontend capabilities to be added to the navigation bar
    const navbar = document.querySelector('nav');
    Beans.get(ManifestService).lookupCapabilities$({type: 'microfrontend'})
      .pipe(filterArray(capability => capability.properties.navbar))
      .subscribe(capabilities => {
        navbar.innerHTML = null;
        capabilities.forEach(capability => {
          const menuItem = navbar.appendChild(document.createElement('button'));
          menuItem.innerText = capability.properties.navbar.label;
          menuItem.addEventListener('click', () => {
            Beans.get(OutletRouter).navigate(capability.qualifier);
          });
        })
      });
  }
}

new HostController().init();
```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>

   You have now learned the core concepts of the SCION Microfrontend Platform. Click [here][link-getting-started:09:summary] for a summary and further reading.

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
[link-getting-started:08:browse-capabilities]: 08-getting-started-browse-capabilities.md
[link-getting-started:09:summary]: 09-getting-started-summary.md
