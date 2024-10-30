<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Create Host Application

The host app provides the top-level integration container for microfrontends. It is the web app which the user loads into the browser that provides the main application shell, defining areas to embed microfrontends.

***
- **Project directory:**\
  scion-microfrontend-platform-getting-started/host-app
- **Installing modules (if not already done):**\
  `npm run install`
- **Starting the app:**\
  `npm run start`
- **Opening the app in the browser:**\
  http://localhost:4200
***


<details>
   <summary><strong>Prerequisites</strong></summary>
   
If you checked out the `skeleton` branch of the Git repository for this guide, the directory structure should look like this. If not, please refer to [How to complete this guide][link-getting-started#installation] for step-by-step instructions.

```
   scion-microfrontend-platform-getting-started
   ├── host-app
   │   ├── src
   │   │   ├── index.html // HTML template
   │   │   ├── host.ts // TypeScript file
   │   │   └── host.scss // SASS stylesheet
   │   ├── package.json
   │   └── tsconfig.json
```
</details>

 
Follow the following instructions to get the host app running.

<details>
  <summary><strong>Install the SCION Microfrontend Platform</strong></summary>

  Run the following command to install the SCION Microfrontend Platform.

  ```console
  npm install @scion/microfrontend-platform @scion/toolkit rxjs@^7.5.0 --save
  ```

  SCION Microfrontend Platform requires some tools of the module `@scion/toolkit`. By using the above command, those are installed as well.
</details>

<details>
  <summary><strong>Start the SCION Microfrontend Platform</strong></summary>

1. Open the TypeScript file `host-app/src/host.ts`.
2. Start the platform by adding the following lines to the `init` method:
   ```ts
         import { MicrofrontendPlatformHost } from '@scion/microfrontend-platform';   
  
         public async init(): Promise<void> {
   [+]     await MicrofrontendPlatformHost.start({
   [+]       applications: [],
   [+]     });
         }
   ```

     > Lines to be added are preceded by the [+] mark.

   For now, we are only starting the platform. Later in this tutorial we will register the *Products App* and the *Customers App* so that they can interact with the platform.
</details>

<details>
  <summary><strong>Embed microfrontends</strong></summary>

  In this section, we will embed the *ProductList Microfrontend* and *CustomerList Microfrontend*.

1. Open the HTML template `host-app/src/index.html`.
2. Add three router outputs to the `<main>` element, as follows:
   ```html
         <main>
   [+]     <sci-router-outlet></sci-router-outlet>
   [+]     <sci-router-outlet name="aside"></sci-router-outlet>
   [+]     <sci-router-outlet name="bottom"></sci-router-outlet>
         </main>
   ```

   Note that we do not name the first outlet, so it acts as the primary outlet to display main content such as our products and customers. The second output we name `aside` to display secondary content, such as details about a product or customer. The last outlet we named `bottom` will display the SCION DevTools to inspect our application.
 
     > A router outlet is a placeholder that the platform dynamically fills based on the current router state. Using the router, you can instruct an outlet to embed a microfrontend. By giving an outlet a name, you can reference it as the routing target. If not naming an outlet, its name defaults to `primary`. The concept of the router outlet is inspired by the Angular routing mechanism. For more information, refer to the [Developer Guide][link-getting-started:developer-guide:routing].

3. Add two navigation buttons to the `<nav>` element to open the *ProductList Microfrontend* and *CustomerList Microfrontend*, as follows:
   ```html
         <nav>
   [+]     <button id="products">Products</button>
   [+]     <button id="customers">Customers</button>
         </nav>
   ```
4. In the host controller `host-app/src/host.ts`, register a `click` event handler on the buttons and navigate the primary router outlet to the *ProductList Microfrontend* respectively to the *CustomerList Microfrontend*, as follows:

   ```ts
   [+]   import {MicrofrontendPlatformHost, OutletRouter} from '@scion/microfrontend-platform';
   [+]   import {Beans} from '@scion/toolkit/bean-manager';        

         public async init(): Promise<void> {
           await MicrofrontendPlatformHost.start({
             applications: [],
           });

   [+]     // Install navigation listeners
   [+]     document.querySelector('button#products').addEventListener('click', () => {
   [+]       Beans.get(OutletRouter).navigate('http://localhost:4201/product-list/product-list.html');
   [+]     });

   [+]     document.querySelector('button#customers').addEventListener('click', () => {
   [+]       Beans.get(OutletRouter).navigate('http://localhost:4202/customer-list/customer-list.html');
   [+]     });
         }
   ```

   We get a reference to the router using the bean manager. The router can be passed a URL and options to control navigation. In the above example, we do not pass any options, so the routing refers to the primary router outlet.
</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications.

When you open the page http://localhost:4200, you see:
- two navigation buttons to open the *ProductList Microfrontend* and *CustomerList Microfrontend* in the primary router outlet
- three router outlets as placeholder for routed content

So far, the microfrontends only display a header. In the next chapters we are going to implement the *Products App* and *Customers App*.
</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

We installed and started the SCION Microfrontend Platform and added router outlets to the host app HTML template to display microfrontends. When you click the `Products` button, the primary router outlet will display the *ProductList Microfrontend*, and when you click the `Customers` button, the *CustomerList Microfrontend* will open.


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
    <nav>
      <button id="products">Products</button>
      <button id="customers">Customers</button>
    </nav>
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
import {MicrofrontendPlatformHost, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

class HostController {

  public async init(): Promise<void> {
    await MicrofrontendPlatformHost.start({
      applications: [],
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

</details>

<details>
   <summary><strong>What's next</strong></summary>

In the next chapter, we will develop the *Products App*. Click [here][link-getting-started:02:products-app] to continue. 
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
[link-getting-started:developer-guide:routing]: https://microfrontend-platform-developer-guide.scion.vercel.app/#chapter:embedding-microfrontends

