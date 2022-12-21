<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Microfrontend Navigation

In the past two chapters we created the *Products App* and *Customers App* and integrated their microfrontends in the primary router outlet of the host app. In this chapter we are going to change the navigation to the *Product Microfrontend* and *Customer Microfrontend* so that they are displayed in the named outlet to the right of the primary outlet.

So far, we have not had to register our micro apps in the host app because they did not interact with the platform. In order to register a micro app, the app must provide a manifest file, which is a special file that contains information about the application, such as its intentions and capabilities. We will learn more about capabilities and intentions in the next chapter.

<details>
  <summary><strong>Provide a manifest file for the micro apps</strong></summary>

1. Create an empty file in the directory `products-app/src` and name it `manifest.json`. Then add the application's name to the manifest, as follows:

   ```json
   {
     "name": "Products App"
   }
   ```
2. Create an empty file in the directory `customers-app/src` and name it `manifest.json`. Then add the application's name to the manifest, as follows:

   ```json
   {
     "name": "Customers App"
   }
   ```
</details>

<details>
  <summary><strong>Register the micro apps in the host</strong></summary>

Micro apps which want to interact with the platform need to be registered in the host. To register the *Products App* and *Customers App*, open the file `host-app/src/host.ts` and register them, as follows:

```ts
      public async init(): Promise<void> {
        await MicrofrontendPlatformHost.start({
          applications: [
[+]         {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
[+]         {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
          ],
        });

        // Install navigation listeners
        document.querySelector('button#products').addEventListener('click', () => {
          Beans.get(OutletRouter).navigate('http://localhost:4201/product-list/product-list.html');
        });

        document.querySelector('button#customers').addEventListener('click', () => {
          Beans.get(OutletRouter).navigate('http://localhost:4202/customer-list/customer-list.html');
        });
      }
```

Each micro app must be assigned a unique symbolic name. The micro app will use that symbolic name to connect to the platform. The registration further requires the URL to the application's manifest which we created in the previous step.

</details>

<details>
  <summary><strong>Install the SCION Microfrontend Platform</strong></summary>

1. Run the following command to install the SCION Microfrontend Platform in the *Products App*.
   ```console
   cd products-app
   npm install @scion/microfrontend-platform @scion/toolkit rxjs@^7.5.0 --save
   ```
2. Run the following command to install the SCION Microfrontend Platform in the *Customers App*.
   ```console
   cd customers-app
   npm install @scion/microfrontend-platform @scion/toolkit rxjs@^7.5.0 --save
   ```
</details>

<details>
  <summary><strong>Open the *Product Microfrontend* to the right of the *ProductList Microfrontend*</strong></summary>

1. In the *Products App*, open the file `products-app/src/product-list/product-list.ts`.
2. Change the `init` method to connect to the platform host and pass `products-app` as the application's symbolic name. It must be exactly the same symbolic name under which we registered the app in the host.
 
   ```ts
         import {ProductService} from '../product.service';
         import {QueryParams} from '../query-params';
   [+]   import {MicrofrontendPlatformClient} from '@scion/microfrontend-platform';

         public async init(): Promise<void> {
   [+]     await MicrofrontendPlatformClient.connect('products-app');
           QueryParams.observe$.subscribe(queryParams => {
             const productIds = queryParams.get('ids')?.split(',');
             this.render(productIds);
           });
         }
   ```
3. Change the `render` method to open the *Product Microfrontend* to the right of the products, as follows:

   ```ts
         import {ProductService} from '../product.service';
         import {QueryParams} from '../query-params';
   [+]   import {MicrofrontendPlatformClient, OutletRouter} from '@scion/microfrontend-platform';
   [+]   import {Beans} from '@scion/toolkit/bean-manager';   
   
         public render(ids?: string[]): void {
           const productsSection = document.querySelector('section#products');
           productsSection.innerHTML = null;

           ProductService.INSTANCE.getProducts({ids}).forEach(product => {
             // Product Name
             const productLink = productsSection.appendChild(document.createElement('a'));
             productLink.innerText = product.name;
   [+]       productLink.addEventListener('click', () => {
   [+]         Beans.get(OutletRouter).navigate(`/product/product.html#?id=${product.id}`, {outlet: 'aside'});
   [+]       });

             // Product Price
             productsSection.appendChild(document.createTextNode(`$ ${product.price.toFixed(2)}`));
           });
         }
   ```
   Instead of specifying the `href` attribute, add a click listener to the link. When clicked, use the router to navigate the passed URL in the specified outlet.

</details>

<details>
  <summary><strong>Open the *Customer Microfrontend* to the right of the *CustomerList Microfrontend*</strong></summary>

1. In the *Customers App*, open the file `customers-app/src/customer-list/customer-list.ts`.
2. Change the `init` method to connect to the platform host and pass `customers-app` as the application's symbolic name. It must be exactly the same symbolic name under which we registered the app in the host.
 
   ```ts
         import {CustomerService} from '../customer.service';
   [+]   import {MicrofrontendPlatformClient} from '@scion/microfrontend-platform';

         public async init(): Promise<void> {
   [+]     await MicrofrontendPlatformClient.connect('customers-app');
           this.render();
         }
   ```
3. Change the `render` method to open the *Customer Microfrontend* to the right of the customers, as follows:

   ```ts
         import {CustomerService} from '../customer.service';
   [+]   import {MicrofrontendPlatformClient, OutletRouter} from '@scion/microfrontend-platform';
   [+]   import {Beans} from '@scion/toolkit/bean-manager';

         public render(): void {
           const customersSection = document.querySelector('section#customers');

           CustomerService.INSTANCE.getCustomers().forEach(customer => {
             // Customer Link
             const customerLink = customersSection.appendChild(document.createElement('a'));
             customerLink.innerText = `${customer.firstname} ${customer.lastname}`;
   [+]       customerLink.addEventListener('click', () => {
   [+]         Beans.get(OutletRouter).navigate(`/customer/customer.html#?id=${customer.id}`, {outlet: 'aside'});
   [+]       });

             // City
             customersSection.appendChild(document.createTextNode(customer.city));
           });
         }
   ```
   Instead of specifying the `href` attribute, add a click listener to the link. When clicked, use the router to navigate the passed URL in the specified outlet.

</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications.

When you open the page http://localhost:4200 in your browser and open a product or customer, that microfrontend should now be opened to the right of the product or customer list.

</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

In this chapter, we changed the navigation to the *Product Microfrontend* and *Customer Microfrontend* so that they are displayed in a named router outlet to the right of the primary outlet.

<details>
   <summary>The <code>products-app/src/manifest.json</code> looks as following:</summary>

```json
{
  "name": "Products App",
}
```
</details>

<details>
   <summary>The <code>customers-app/src/manifest.json</code> looks as following:</summary>

```json
{
  "name": "Customers App"
}
```
</details>

<details>
   <summary>The <code>host-app/src/host.ts</code> looks as following:</summary>

```ts
import {MicrofrontendPlatformHost, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

class HostController {

public async init(): Promise<void> {
  await MicrofrontendPlatformHost.start({
    applications: [
      {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
      {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
    ],
  });

  // Install navigation listeners
  document.querySelector('button#products').addEventListener('click', () => {
    Beans.get(OutletRouter).navigate('http://localhost:4201/product-list/product-list.html');
  });
  
  document.querySelector('button#customers').addEventListener('click', () => {
    Beans.get(OutletRouter).navigate('http://localhost:4202/customer-list/customer-list.html');
  });
  }
}

new HostController().init();
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
        Beans.get(OutletRouter).navigate(`/product/product.html#?id=${product.id}`, {outlet: 'aside'});
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
        Beans.get(OutletRouter).navigate(`/customer/customer.html#?id=${customer.id}`, {outlet: 'aside'});
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

In the next chapter, we will learn how to embed a microfrontend in a microfrontend. Click [here][link-getting-started:05:embed-microfrontend] to continue.

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
