<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Embed Microfrontend

In this chapter, we will display the products purchased by the customer in the *Customer Microfrontend* as embedded microfrontend. 

<details>
  <summary><strong>Add router outlet to display the products of a customer</strong></summary>

Open the HTML template `customers-app/src/customer/customer.html`. After the section for displaying information about the customer, add a router outlet and give it the name `customer-products`.

```html
     <body>
       <h1>Customer</h1>
        <section id="customer"></section>
[+]     <sci-router-outlet name="customer-products"></sci-router-outlet>
     </body> 
```
</details>

<details>
  <summary><strong>Display the *ProductList Microfrontend*</strong></summary>

1. Open the file `customers-app/src/customer/customer.ts`
2. Connect to the platform so we can use the outlet router for navigation, as follows:
   ```ts
         import {CustomerService} from '../customer.service';
         import {QueryParams} from '../query-params';
   [+]   import {MicrofrontendPlatformClient} from '@scion/microfrontend-platform';

         public async init(): Promise<void> {
   [+]     await MicrofrontendPlatformClient.connect('customers-app');
           QueryParams.observe$.subscribe(queryParams => this.render(queryParams.get('id')));
         }
   ```
3. Navigate the outlet to display the products of the customer.

   ```ts
         import {CustomerService} from '../customer.service';
         import {QueryParams} from '../query-params';
   [+]   import {Beans} from '@scion/toolkit/bean-manager';
   [+]   import {MicrofrontendPlatform, OutletRouter} from '@scion/microfrontend-platform';
   
         public render(customerId: string): void {
           const customerSection = document.querySelector('section#customer');
           const customer = CustomerService.INSTANCE.getCustomer(customerId);

           customerSection.innerHTML = null;

           // Firstname
           customerSection.appendChild(document.createElement('label')).innerText = 'Firstname:';
           customerSection.appendChild(document.createTextNode(customer.firstname));

           // Lastname
           customerSection.appendChild(document.createElement('label')).innerText = 'Lastname:';
           customerSection.appendChild(document.createTextNode(customer.lastname));

           // Street
           customerSection.appendChild(document.createElement('label')).innerText = 'Street:';
           customerSection.appendChild(document.createTextNode(customer.street));

           // City
           customerSection.appendChild(document.createElement('label')).innerText = 'City:';
           customerSection.appendChild(document.createTextNode(customer.city));

           // Email
           customerSection.appendChild(document.createElement('label')).innerText = 'Email:';
           customerSection.appendChild(document.createTextNode(customer.email));

           // Phone
           customerSection.appendChild(document.createElement('label')).innerText = 'Phone:';
           customerSection.appendChild(document.createTextNode(customer.phone));

   [+]     // Display the products purchased by the customer
   [+]     Beans.get(OutletRouter).navigate('http://localhost:4201/product-list/product-list.html#?ids=:ids', {
   [+]       params: {ids: customer.productIds},
   [+]       outlet: 'customer-products',
   [+]     });
         }
   ```
   Using the router, display the *ProductList Microfrontend* in the outlet named `customer-products`, passing the IDs of the products purchased by the customer as query parameter.

</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications.

When you open the page http://localhost:4200 in your browser and open a customer, you should see the products purchased by that customer.

</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

In this chapter, we learned that outlets can be nested, allowing a microfrontend to embed another microfrontend. There is no limit to the number of nested outlets. However, be aware that nested content is loaded cascaded, that is, only loaded once its parent content finished loading.

<details>
   <summary>The <code>customers-app/src/customer/customer.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Customer</title>
    <link rel="stylesheet" type="text/css" href="customer.scss">
    <script type="module" src="./customer.ts"></script>
  </head>
  <body>
    <h1>Customer</h1>
    <section id="customer"></section>
    <sci-router-outlet name="customer-products"></sci-router-outlet>
  </body>
</html>
```
</details>

<details>
   <summary>The <code>customers-app/src/customer/customer.ts</code> looks as following:</summary>

```ts
import {CustomerService} from '../customer.service';
import {QueryParams} from '../query-params';
import {Beans} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatformClient, OutletRouter} from '@scion/microfrontend-platform';

class CustomerController {

  public async init(): Promise<void> {
    await MicrofrontendPlatformClient.connect('customers-app');
    QueryParams.observe$.subscribe(queryParams => this.render(queryParams.get('id')));
  }

  public render(customerId: string): void {
    const customerSection = document.querySelector('section#customer');
    const customer = CustomerService.INSTANCE.getCustomer(customerId);

    customerSection.innerHTML = null;

    // Firstname
    customerSection.appendChild(document.createElement('label')).innerText = 'Firstname:';
    customerSection.appendChild(document.createTextNode(customer.firstname));

    // Lastname
    customerSection.appendChild(document.createElement('label')).innerText = 'Lastname:';
    customerSection.appendChild(document.createTextNode(customer.lastname));

    // Street
    customerSection.appendChild(document.createElement('label')).innerText = 'Street:';
    customerSection.appendChild(document.createTextNode(customer.street));

    // City
    customerSection.appendChild(document.createElement('label')).innerText = 'City:';
    customerSection.appendChild(document.createTextNode(customer.city));

    // Email
    customerSection.appendChild(document.createElement('label')).innerText = 'Email:';
    customerSection.appendChild(document.createTextNode(customer.email));

    // Phone
    customerSection.appendChild(document.createElement('label')).innerText = 'Phone:';
    customerSection.appendChild(document.createTextNode(customer.phone));

    // Display the products purchased by the customer
    Beans.get(OutletRouter).navigate('http://localhost:4201/product-list/product-list.html#?ids=:ids', {
      params: {ids: customer.productIds},
      outlet: 'customer-products',
    });
  }
}

new CustomerController().init();
```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>

In the next chapter, we will learn how to navigate via intent. Click [here][link-getting-started:06:navigate-via-intent] to continue.

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
