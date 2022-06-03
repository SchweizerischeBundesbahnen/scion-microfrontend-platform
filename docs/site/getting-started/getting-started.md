<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Getting Started
This Getting Started Guide introduces you to the basics of the SCION Microfrontend Platform by developing a simple [eCommerce web application](https://scion-microfrontend-platform-getting-started.vercel.app), allowing us to view our products, our customers and the products a customer has purchased.

In the course of this tutorial, we will create two independent applications, also referred to as micro apps, the *Products App* and the *Customers App*, each providing two microfrontends. We will also create a host app to integrate the two micro apps.

- **Host App**\
  Provides the top-level integration container for microfrontends. It is the web app which the user loads into his browser that provides the main application shell, defining areas to embed microfrontends.

- **Products App**\
  Provides the *ProductList Microfrontend* and *Product Microfrontend*, so that we can view our products.

- **Customers Apps**\
  Provides the *CustomerList Microfrontend* and *Customer Microfrontend*, so that we can view our customers. The *Customer Microfrontend* further embeds the *ProductList Microfrontend* to show the products purchased by a customer.

**When you have finished this guide, the app should look as follows: https://scion-microfrontend-platform-getting-started.vercel.app.**

***

#### How to complete this guide

We recommend cloning the source code repository for this guide. It contains minimal application skeletons to get started straight away. 

<details>
    <summary><strong>Follow these step-by-step instructions to get you ready</strong></summary>

1. Clone the Git repository for this guide:
   ```console
   git clone https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform-getting-started
   ```
   or
   ```console
   git clone git@github.com:SchweizerischeBundesbahnen/scion-microfrontend-platform-getting-started.git
   ```
1. Navigate to the new cloned project directory: 
   ```console
   cd scion-microfrontend-platform-getting-started
   ```
1. Checkout the `skeleton` branch:
   ```console
   git checkout skeleton
   ```
   
   <details>
       <summary>The directory structure should look like this.</summary>
   
   ```
   scion-microfrontend-platform-getting-started
   ├── host-app
   │   ├── src
   │   │   ├── index.html // HTML template
   │   │   ├── host.ts // TypeScript file
   │   │   └── host.scss // SASS stylesheet
   │   ├── package.json
   │   └── tsconfig.json
   │
   ├── products-app
   │   ├── src
   │   │   ├── product // Product Microfrontend
   │   │   │    ├── product.html
   │   │   │    ├── product.ts
   │   │   │    └── product.scss
   │   │   ├── product-list  // ProductList Microfrontend
   │   │   │    ├── product-list.html
   │   │   │    ├── product-list.ts
   │   │   │    └── product-list.scss
   │   │   ├── index.html
   │   │   ├── product.data.json
   │   │   ├── product.service.ts
   │   │   └── query-params.ts
   │   ├── package.json
   │   └── tsconfig.json
   │
   ├── customers-app
   │   ├── src
   │   │   ├── customer  // Customer Microfrontend
   │   │   │    ├── customer.html
   │   │   │    ├── customer.ts
   │   │   │    └── customer.scss
   │   │   ├── customer-list  // CustomerList Microfrontend
   │   │   │    ├── customer-list.html
   │   │   │    ├── customer-list.ts
   │   │   │    └── customer-list.scss
   │   │   ├── index.html
   │   │   ├── customer.data.json
   │   │   ├── customer.service.ts
   │   │   └── query-params.ts
   │   ├── package.json
   │   └── tsconfig.json
   │
   └── package.json
   ```
   </details>
   
1. Install required modules using the `npm install` command. This can take some time as the modules have to be installed for all three applications. 
   ```console
   npm install
   ```
1. Start all applications using the following npm run command:
   ```console
   npm run start
   ```
1. Open your browser and enter the URL http://localhost:4200. You should see a blank page.

</details>

<details>
    <summary><strong>Good to know</strong></summary>

- The source code of the final app you find on [Github](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform-getting-started) on the `master` branch.
- You can start the app using the `npm run start` command.
- We use [Parcel][link-parcel] as web application bundler to build and serve the apps.
- When you have finished this guide, the app should look as follows: https://scion-microfrontend-platform-getting-started.vercel.app.
- The applications are served at the following URLs:
  - Host App: http://localhost:4200
  - Products App: http://localhost:4201
  - Customers App: http://localhost:4202
</details>

***

We can now move on to the development of the host and micro apps. The applications we are developing are pure TypeScript applications, i.e., they do not depend on a web framework like [Angular][link-angular],  [React][link-react], [Vue.js][link-vuejs], or similar. If you have started with the skeleton as described above, the CSS files are already prepared and provide basic styling. In the following, we will not go any further into the CSS content.
 
1. #### [Create the *Host Application*][link-getting-started:01:host-app]
2. #### [Create the *Products Application*][link-getting-started:02:products-app]
3. #### [Create the *Customers Application*][link-getting-started:03:customers-app]
4. #### [Learn how to navigate to a microfrontend][link-getting-started:04:microfrontend-routing]
5. #### [Learn how to embed a microfrontend][link-getting-started:05:embed-microfrontend]
6. #### [Learn how to navigate via intent][link-getting-started:06:navigate-via-intent]
7. #### [Learn how to integrate the SCION DevTools][link-getting-started:07:devtools]
8. #### [Learn how to browse the catalog of capabilities][link-getting-started:08:browse-capabilities]
9. #### [Summary][link-getting-started:09:summary]


[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-angular]: https://angular.io/
[link-react]: https://reactjs.org/
[link-vuejs]: https://vuejs.org/
[link-parcel]: https://parceljs.org/

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
