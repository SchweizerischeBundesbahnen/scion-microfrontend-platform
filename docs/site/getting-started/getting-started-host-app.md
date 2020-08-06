<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Host Application

The host application provides the top-level integration container for microfrontends. It is the web app which the user loads into his browser and provides the main application shell, defining areas to embed microfrontends.

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
   <br>
   
If you checked out the `skeleton` branch of the Git repository for this guide, the directory structure should look like this. If not, please refer to [How to complete this guide][link-getting-started#installation] for step-by-step instructions.

```
   scion-microfrontend-platform-getting-started
   ├── host-app
   │   ├── src
   │   │   ├── index.html // HTML template
   │   │   ├── host-controller.ts // TypeScript file
   │   │   └── styles.scss // Sass stylesheet
   │   ├── package.json
   │   └── tsconfig.json
```
</details>

 
Follow the following instructions to get the host application running.

<details>
   <summary><strong>Registration of the micro applications</strong></summary>
   <br>

In this section, we will register the `host`, `products` and `shopping cart` as micro applications and start the platform host. Registered micro applications can interact with the platform and other micro applications.
   
1. Open the TypeScript file `host-controller.ts`.
1. Configure the micro applications by adding the following content before the constructor:
   ```ts
   import { ApplicationConfig } from '@scion/microfrontend-platform';

   private platformConfig: ApplicationConfig[] = [
     {symbolicName: 'host-app', manifestUrl: '/manifest.json'},
     {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
     {symbolicName: 'shopping-cart-app', manifestUrl: 'http://localhost:4202/manifest.json'},
   ];
   ```  
   For each micro application, we provide an application config with the application's symbolic name and the URL to its manifest. Symbolic names must be unique and are used by the micro applications to connect to the platform host. The manifest is a JSON file that contains information about a micro application.
1. Next, start the platform and register the micro applications by adding the following content to the `init` method, as follows:
   ```ts
        import { MicrofrontendPlatform } from '@scion/microfrontend-platform';   
   
        public async init(): Promise<void> {
   [+]    await MicrofrontendPlatform.startHost(this.platformConfig, {symbolicName: 'host-app'});
        }   
   ```
   > Lines to be added are preceded by the [+] mark.
   
   The second argument is the symbolic name of the micro application starting the platform host. It is optional. If specified, we can interact with the platform and other micro applications, e.g., publish messages or navigate in router outlets.
</details>

<details>
   <summary><strong>Embed microfrontends</strong></summary>
   <br>

In this section, we will embed the `products` and `shopping cart` microfrontends.
   
1. Open the HTML template `index.html`.
1. Add a button to the HTML template to show the shopping cart, as follows:
   ```html
   <nav>
     <button class="shopping-cart">Shopping Cart</button>
   </nav>
   ```
1. Add two router outlets to the HTML template, as follows:
   ```html
   <sci-router-outlet></sci-router-outlet>
   <sci-router-outlet name="SHOPPING-CART"></sci-router-outlet>
   ```
   In the first router outlet, we will show the `products` microfrontend. It has no name, so it defaults to the primary router outlet. In the second router outlet, we will show the `shopping cart` microfrontend.
   
   > A router outlet is a placeholder that the platform dynamically fills based on the current router state. Using the router, you can instruct an outlet to embed a microfrontend. By giving an outlet a name, you can reference it as the routing target. If not naming an outlet, its name defaults to `primary`. The concept of the router outlet is inspired by the Angular routing mechanism. For more information, refer to the [Developer Guide][link-developer-guide#routing].
1. Open the TypeScript file `host-controller.ts`.
1. Now, we want to route the primary router outlet to display the `products` microfrontend, as follows:

   ```ts
        import { Beans, OutletRouter } from '@scion/microfrontend-platform';   
   
        public async init(): Promise<void> {
          // Start the platform
          await MicrofrontendPlatform.startHost(this.platformConfig, {symbolicName: 'host-app'});
 
   [+]    // Display the `products` microfrontend in the primary router outlet
   [+]    Beans.get(OutletRouter).navigate('http://localhost:4201/products.html');
        }
   ```
   > Lines to be added are preceded by the [+] mark.

   The `OutletRouter` allows us to route the content of a `<sci-router-outlet>`. Since we do not specify a target outlet, navigation refers to the primary router outlet. We get the router via the platform's bean manager.
1. Next, we want to display the `shopping cart` microfrontend when the user clicks the shopping cart button.

   In the constructor, add a click listener to the shopping cart button and invoke the method `onToggleShoppingCart`, as follows:
   ```ts
   import { MessageClient } from '@scion/microfrontend-platform';
   
   constructor() {
     document.querySelector('button.shopping-cart').addEventListener('click', () => this.onToggleShoppingCart());
   }
   
   private onToggleShoppingCart(): void {
     // Publish message to toggle the shopping cart panel when the user clicks the shopping cart button
     Beans.get(MessageClient).publish('shopping-cart/toggle-side-panel');
   }
   ```
   
   Unlike to embedding the `products` microfrontend, we publish a message to show the `shopping cart` microfrontend. As of now, nothing would happen when the user clicks on that button, because we did not register a message listener yet. It is important to understand that the platform transports that message to all micro applications. Later, when implementing the `shopping cart` micro application, we will subscribe to such messages and navigate accordingly. Of course, we could also use the `OutletRouter` directly. For illustrative purposes, however, we use an alternative approach, which further has the advantage that we do not have to know the URL of the microfrontend to embed it. Instead, we let the providing micro application perform the routing, keeping the microfrontend URL an implementation detail of the micro application that provides the microfrontend.
   
   > Note: It would be even better to use the Intention API for showing a microfrontend, which, however, would go beyond the scope of this Getting Started Guide. For more information, refer to the [Developer Guide][link-developer-guide#routing-in-the-activator].

</details>

<details>
   <summary><strong>Make the shopping cart router outlet a side panel</strong></summary>
   <br>
   
We want the shopping cart outlet to behave like a side panel that the user can expand or collapse by clicking on the shopping cart button.

Therefore, open the stylesheet file `styles.scss` and add the following style:
   
```scss
sci-router-outlet[name="SHOPPING-CART"].sci-empty {
  display: none;
}
```
</details>

<details>
   <summary><strong>Provide a manifest file</strong></summary>
   <br>
   
In this step, we finally provide the manifest JSON file that we referenced in the first step. If not providing a manifest file, we could not connect to the platform.

Create the file `manifest.json` in the `src` folder, as follows:
```json
{
  "name": "Host App"
}
```

The manifest must declare at least the human-readable name of the application. The name has no meaning to the platform, but is used, for example, by the DevTools to list the micro applications.

To learn more about the manifest, refer to the [Developer Guide][link-developer-guide#manifest].

> This step requires to serve the application anew. 

</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>
   <br>

We did it! Run `npm run start` to serve the applications.

If you open the page http://localhost:4200, you will not see much yet. That's because we first have to implement the micro applications for `products` and `shopping cart`. If you open the console panel of your browser, you will see that the platform tries to load the manifests for the `products` and `shopping cart` micro applications, which leads to an error because not yet available.
 
You may wonder why you can see the `products` microfrontend. To embed a microfrontend, you do not need to register it as a micro application. You only need to register an app as a micro application if the app wants to interact with the platform.
</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>
   <br>

We have added two router outlets to the HTML template of the host application for embedding the `products` and `shopping cart` microfrontends. We are loading the `products` microfrontend using the platform router. For the `shopping cart` microfrontend, we chose an alternative approach. Instead of routing ourselves, we delegate the routing to the `shopping cart` application by publishing a message.

<details>
   <summary>The <code>index.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Webshop</title>
    <link rel="stylesheet" type="text/css" href="styles.scss">
    <script defer src="./host-controller.ts"></script>
  </head>
  <body>
    <nav>
      <button class="shopping-cart">Shopping Cart</button>
    </nav>
    <sci-router-outlet></sci-router-outlet>
    <sci-router-outlet name="SHOPPING-CART"></sci-router-outlet>
  </body>
</html>
```
</details>


<details>
   <summary>The <code>host-controller.ts</code> looks as following:</summary>

```ts
import { ApplicationConfig, Beans, MessageClient, MicrofrontendPlatform, OutletRouter } from '@scion/microfrontend-platform';

class HostController {

  private platformConfig: ApplicationConfig[] = [
    {symbolicName: 'host-app', manifestUrl: '/manifest.json'},
    {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
    {symbolicName: 'shopping-cart-app', manifestUrl: 'http://localhost:4202/manifest.json'},
  ];

  constructor() {
    document.querySelector('button.shopping-cart').addEventListener('click', () => this.onToggleShoppingCart());
  }

  public async init(): Promise<void> {
    // Start the platform
    await MicrofrontendPlatform.startHost(this.platformConfig, {symbolicName: 'host-app'});

    // Display the products microfrontend in the primary router outlet
    Beans.get(OutletRouter).navigate('http://localhost:4201/products.html');
  }

  private onToggleShoppingCart(): void {
    // Publish message to toggle the shopping cart panel when the user clicks the shopping cart button
    Beans.get(MessageClient).publish('shopping-cart/toggle-side-panel');
  }
}

new HostController().init();
```
</details>

<details>
   <summary>The <code>manifest.json</code> looks as following:</summary>

```json
{
  "name": "Host App"
}

```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>
   <br>

   Next, we will develop the `products` micro application so that the user can view the products of our webshop. Click [here][link-getting-started:products-app] to continue. 
</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[menu-getting-started]: /docs/site/getting-started/getting-started.md
[link-getting-started#installation]: /docs/site/getting-started/getting-started.md#how-to-complete-this-guide
[link-developer-guide#routing-in-the-activator]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:activator:routing-in-the-activator
[link-developer-guide#routing]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:embedding-microfrontends
[link-developer-guide#manifest]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:intention-api:manifest
[link-getting-started:products-app]: /docs/site/getting-started/getting-started-products-app.md
