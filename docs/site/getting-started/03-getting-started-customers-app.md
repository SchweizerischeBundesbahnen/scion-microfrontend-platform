<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Create Customers Application

The customers micro app provides two microfrontends, the *CustomerList Microfrontend* that lists our customers, and the *Customer Microfrontend* that displays a customer.

***
- **Project directory:**\
  scion-microfrontend-platform-getting-started/customers-app
- **Installing modules (if not already done):**\
  `npm run install`
- **Starting the app:**\
  `npm run start`
- **Opening the app in the browser:**\
  http://localhost:4202
***


<details>
   <summary><strong>Prerequisites</strong></summary>
   
If you checked out the `skeleton` branch of the Git repository for this guide, the directory structure should look like this. If not, please refer to [How to complete this guide][link-getting-started#installation] for step-by-step instructions.

```
   scion-microfrontend-platform-getting-started
   ├── customers-app
   │   ├── src
   │   │   ├── customer // Customer Microfrontend
   │   │   │    ├── customer.html
   │   │   │    ├── customer.ts
   │   │   │    └── customer.scss
   │   │   ├── customer-list  // CustomerList Microfrontend
   │   │   │    ├── customer-list.html
   │   │   │    ├── customer-list.ts
   │   │   │    └── customer-list.scss
   │   │   ├── index.html
   │   │   ├── customer.data.json // Sample data
   │   │   ├── customer.service.ts // Service to access sample data
   │   │   └── query-params.ts
   │   ├── package.json
   │   └── tsconfig.json
```
</details>

 
Follow the following instructions to get the *Customers App* running.

<details>
  <summary><strong>Start the *Customers App*</strong></summary>

Run `npm run start` to start the application. Then open the page http://localhost:4202 in your browser. You should see two links to open the *CustomerList Microfrontend* and *Customer Microfrontend*. When you click on a link, the particular microfrontend opens, but does not show much yet, only its title.

By the end of this chapter, the *CustomerList Microfrontend* will list our customers. When clicking on a customer link, we can navigate to the *Customer Microfrontend* to see details about the customer.

</details>

<details>
  <summary><strong>Implement the *CustomerList Microfrontend*</strong></summary>

In this section, we will implement the *CustomerList Microfrontend* that lists our customers.

1. Open the HTML template `customers-app/src/customer-list/customer-list.html`.
2. After the `<h1>` element, add a section to display our customers, as follows:
   ```html
         <body>
           <h1>Customers</h1>
   [+]     <section id="customers"></section>
         </body> 
   ```
3. Open the TypeScript file `customers-app/src/customer-list/customer-list.ts` and add the following method after the `init` method. This method will render all our customers. 

   ```ts
         import {CustomerService} from '../customer.service';

         public render(): void {
           const customersSection = document.querySelector('section#customers');
         
           CustomerService.INSTANCE.getCustomers().forEach(customer => {
             // Customer Link
             const customerLink = customersSection.appendChild(document.createElement('a'));
             customerLink.innerText = `${customer.firstname} ${customer.lastname}`;
             customerLink.href = `/customer/customer.html#?id=${customer.id}`;
         
             // City
             customersSection.appendChild(document.createTextNode(customer.city));
           });
         }
   ```
   We need a reference to the `<section>` element that we added to the template in the previous step. Our customers will be added to this section. Using the `CustomerService`, we query our customers. For each customer, we create an anchor element, that when clicked, navigates to the *Customer Microfrontend* located at `/customer/customer.html`. We pass the ID of the customer in the form of a query parameter. Note that we added the query parameter to the URL's fragment part, that is after the hash (`#`), so that the page is not reloaded when the query parameter is changed. This is similar to hash-based routing, but it only applies to query parameters. Finally, after the link, we append a text node to display the city of the customer.
4. In the `init` method, simply call `render`.

   ```ts
         public async init(): Promise<void> {
   [+]     this.render();
         }
   ```

</details>

<details>
  <summary><strong>Implement the *Customer Microfrontend*</strong></summary>

In this section, we will implement the *Customer Microfrontend* to display a customer.

1. Open the HTML template `customers-app/src/customer/customer.html`.
2. After the `<h1>` element, add a section to display the customer, as follows:
   ```html
         <body>
           <h1>Customer</h1>
   [+]     <section id="customer"></section>
         </body> 
   ```
3. Open the TypeScript file `customers-app/src/customer/customer.ts`.

   Add a `render` method after the `init` method to render the customer of given ID, as follows: 

   ```ts
         import {CustomerService} from '../customer.service';

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
         }
   ```
   We need a reference to the `<section>` element that we added to the template in the previous step. The customer will be added to this section. Since the `render` method is called every time the customer to be displayed change, we clear the section's content first. Finally, using the `CustomerService`, we look up the customer of given ID and display its firstname, lastname, street, city, email and phone.

4. In the `init` method, subscribe to query parameter changes and invoke the `render` method, passing the `id` as argument. The `id` query parameter contains the ID of the customer to be displayed.

   ```ts
         import {CustomerService} from '../customer.service';
   [+]   import {QueryParams} from '../query-params';

         public async init(): Promise<void> {
   [+]     QueryParams.observe$.subscribe(queryParams => this.render(queryParams.get('id')));
         }
   ```
</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications.

When you open the page http://localhost:4200 in your browser and click the `Customers` button, you will see the *CustomerList Microfrontend*. When clicking on a customer, the *Customer Microfrontend* opens, displaying information about the customer. So far, the *Customer Microfrontend* replaces the *CustomerList Microfrontend*. In a subsequent chapter, we will display the customer to the right of the customer list in the `aside` router outlet.

</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

In this chapter, we have implemented the *CustomerList Microfrontend* and *Customer Microfrontend* of the *Customers App*.

<details>
   <summary>The <code>customers-app/src/customer-list/customer-list.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Customers</title>
    <link rel="stylesheet" type="text/css" href="customer-list.scss">
    <script type="module" src="./customer-list.ts"></script>
  </head>
  <body>
    <h1>Customers</h1>
    <section id="customers"></section>
  </body>
</html>
```
</details>

<details>
   <summary>The <code>customers-app/src/customer-list/customer-list.ts</code> looks as following:</summary>

```ts
import {CustomerService} from '../customer.service';

class CustomerListController {

  public async init(): Promise<void> {
    this.render();
  }

  public render(): void {
    const customersSection = document.querySelector('section#customers');

    CustomerService.INSTANCE.getCustomers().forEach(customer => {
      // Customer Link
      const customerLink = customersSection.appendChild(document.createElement('a'));
      customerLink.innerText = `${customer.firstname} ${customer.lastname}`;
      customerLink.href = `/customer/customer.html#?id=${customer.id}`;

      // City
      customersSection.appendChild(document.createTextNode(customer.city));
    });
  }
}

new CustomerListController().init();

```
</details>

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
  </body>
</html>

```
</details>

<details>
   <summary>The <code>customers-app/src/customer/customer.ts</code> looks as following:</summary>

```ts
import {CustomerService} from '../customer.service';
import {QueryParams} from '../query-params';

class CustomerController {

  public async init(): Promise<void> {
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
  }
}

new CustomerController().init();
```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>

In the next chapter, we will learn how to use the outlet router for microfrontend navigation. Click [here][link-getting-started:04:microfrontend-routing] to continue.

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

[link-getting-started#installation]: /docs/site/getting-started/getting-started.md#how-to-complete-this-guide
