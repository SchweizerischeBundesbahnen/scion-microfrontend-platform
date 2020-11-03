<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Shopping Cart Application

The shopping cart application provides the user with a shopping cart in which he/she can add products.

***
- **Project directory:**\
  scion-microfrontend-platform-getting-started/shopping-cart-app
- **Installing modules (if not already done):**\
  `npm run install`
- **Starting the app:**\
  `npm run start`
- **Opening the app in the browser:**\
  http://localhost:4202
***

<details>
   <summary><strong>Prerequisites</strong></summary>
   <br>
   
If you checked out the `skeleton` branch of the Git repository for this guide, the directory structure should look like this. If not, please refer to [How to complete this guide][link-getting-started#installation] for step-by-step instructions.

```
   scion-microfrontend-platform-getting-started
   ├── shopping-cart-app
   │   ├── src
   │   │   ├── shopping-cart.html // HTML template
   │   │   ├── shopping-cart-controller.ts // TypeScript file
   │   │   ├── shopping-cart-service.ts // service to store products added to the cart in the session storage
   │   │   └── styles.scss // Sass stylesheet
   │   ├── package.json
   │   └── tsconfig.json
```
</details>

 
Follow the following instructions to get the `shopping cart` micro application running.

<details>
   <summary><strong>Connect to the platform host</strong></summary>
   <br>

In this section, we will connect the `shopping cart` micro application to the platform host.

1. Open the TypeScript file `shopping-cart-controller.ts`.
1. Connect to the platform host by adding the following content to the `init` method, as follows:
   ```ts
        import { MicrofrontendPlatform } from '@scion/microfrontend-platform';   
   
        public async init(): Promise<void> {
   [+]    await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});
        }   
   ```
   > Lines to be added are preceded by the [+] mark.   

   The only argument we pass is our identity. The platform host then checks whether we are a registered micro application. It also checks our origin, i.e., that our origin matches the manifest origin. This check prevents other micro applications from connecting to the platform on behalf of us.
1. Next, we provide the manifest JSON file that we registered in the host application in the [Getting Started for the Host Application][link-getting-started:host-app].

   Create the file `manifest.json` in the `src` folder, as follows:
   ```json
   {
     "name": "Shopping Cart App"
   }
   ```
   
   To learn more about the manifest, refer to the [Developer Guide][link-developer-guide#manifest].
   
   > This step requires to serve the application anew.
</details>

<details>
   <summary><strong>Show the content of the shopping cart</strong></summary>
   <br>

In this section, we will render the products added to the shopping cart in an unordered list.

1. Open the HTML template `shopping-cart.html`.
1. Add an empty, unordered list after the heading element and decorate it with the CSS class `cart`, as follows:
   ```html
   <ul class="cart"></ul>
   ```
1. Open the TypeScript file `shopping-cart-controller.ts`.
1. Render the content of the shopping cart.

   If we recall the implementation of the `products` micro application, we notice that the `products` microfrontend publishes a message to the topic `shopping-cart/add-product` when the user adds a product to the shopping cart. However, due to the design of our application, our microfrontend may not display at that time. Therefore we would miss the message.  
   
   The concept of activators comes to our rescue. An activator allows a micro application to initialize and connect to the platform when the user loads the host application into his browser. In the course of this Getting Started Guide, we will implement an activator that will listen to messages published to the topic `shopping-cart/add-product` and put the message's payload into session storage. But more about this later. 
    
   In the skeleton for this project, you will find the class `ShoppingCartService` in the file `shopping-cart-service.ts`. It provides us access to the session storage via an RxJS `Observable`, notifying us when the user adds a product to the shopping cart.
   
   Long story short, we can subscribe to `ShoppingCartService.products$` which emits the products contained in the shopping cart. When the user adds a  product to the cart, that `Observable` emits with the current cart content. The dollar sign (`$`) in `products$` name indicates to us developers that it is an `Observable` which we must subscribe to.
     
   In the code snippet below, every time the `Observable` emits, we replace the content of the unordered list with list items of the shopping cart.
   
   Add the lines preceded by the [+] mark to the `init` method.
   
   ```ts
        import { ShoppingCartService } from './shopping-cart-service';
   
        public async init(): Promise<void> {
          // Connect to the platform host
          await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});
 
   [+]    // Render products added to the shopping cart
   [+]    ShoppingCartService.products$.subscribe(products => {
   [+]      const cartElement = document.querySelector('ul.cart');
   [+]      cartElement.innerHTML = products
   [+]        .map(product => `<li>${product.name}</li>`)
   [+]        .join('');
   [+]    });
        }
   ```
   > Lines to be added are preceded by the [+] mark.
1. Next, allow the user to remove all items from the shopping cart.
        
   We add a button to the HTML template so that the user can remove all items from the shopping cart.
   
   Open the HTML template `shopping-cart.html` and add the button, as follows: 
   ```html
       <body>
         <h1>Shopping Cart</h1>
         <ul class="cart"></ul>
   [+]   <button class="clear">Clear</button>
       </body> 
   ```
   > Lines to be added are preceded by the [+] mark.

   In the constructor of `shopping-cart-controller.ts`, add a click listener to the button and invoke the method `onClear`, as following:
   ```ts
   constructor() {
     document.querySelector('button.clear').addEventListener('click', () => this.onClear());
   }
   
   // content skipped ...
   
   private onClear(): void {
     ShoppingCartService.clear();
   }
   ```
</details>

<details>
   <summary><strong>Register an Activator</strong></summary>
   <br>
   
For the `shopping cart` micro application we need to implement an activator to receive requests even when the `shopping cart` microfrontend is not showing.

***
#### What is an Activator
An activator allows a micro application to initialize and connect to the platform when the user loads the host application into his browser. In the broadest sense, an activator is a kind of microfrontend, i.e. an HTML page that runs in an iframe. In contrast to regular microfrontends, however, at platform startup, the platform loads activator microfrontends into hidden iframes for the entire platform lifecycle, thus, providing a stateful session to the micro application on the client-side.

A micro application can register an activator as **public activator capability** in its manifest, as follows:
```json
{
  "capabilities": [
    {
      "type": "activator",
      "private": false, 
      "properties": {
        "path": "path/to/the/activator" 
      }
    }
  ]
}
```

To learn more about capabilities and activators, please refer to the Developer Guide:
- [What is an Activator][link-developer-guide#activator]
- [What is a Capability][link-developer-guide#capability]
***

Let us register an activator:

1. Create a new TypeScript file in the `src` directory and give it the name `activator.ts`, as following:
   ```ts
   class Activator {
   
     public async init(): Promise<void> {
     }
   }
   
   new Activator().init();
   ```

1. Create a new HTML file in the `src` directory and give it the name `activator.html`, as following:
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <title>Shopping Cart Activator</title>
       <script defer src="./activator.ts"></script>
     </head>
     <body></body>
   </html>
   ```
   The only thing this HTML template does is to include the TypeScript file that we created in the previous step. Parcel will transpile it to JavaScript on-the-fly.

   > This step requires to serve the application anew.

1. Register the activator in your manifest.json file, as following:
   ```ts
       {
         "name": "Shopping Cart App",
   [+]   "capabilities": [{
   [+]     "type": "activator",
   [+]     "private": false,
   [+]     "properties": {
   [+]       "path": "activator.html"
   [+]     }
   [+]   }]
       }

   ```
   > Lines to be added are preceded by the [+] mark.

   > This step requires to serve the application anew.
</details>

<details>
   <summary><strong>Activator: Connect to the platform host</strong></summary>
   <br>
   
Like a regular microfrontend, an activator must connect to the platform host to interact with the platform.
   
1. Open the TypeScript file `activator.ts`.
1. Connect to the platform host by adding the following content to the `init` method, as follows:
   ```ts
        import { MicrofrontendPlatform } from '@scion/microfrontend-platform';   
   
        public async init(): Promise<void> {
   [+]    await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});
        }   
   ```
   > Lines to be added are preceded by the [+] mark.   
</details>

<details>
   <summary><strong>Activator: Receive messages for adding products to the shopping cart</strong></summary>
   <br>

In this section, we will listen for messages published to the topic `shopping-cart/add-product` and put the message's payload into session storage. Like in the previous chapter, we use the `ShoppingCartService`.

> Since an activator runs in a separate browsing context, other microfrontends cannot access the state of the activator microfrontend. Instead, an activator could put data, for example, into session storage, so that microfrontends of its micro application can access it. For more information, refer to chapter [Sharing State][link-developer-guide#activator:state-sharing] in the Developer Guide.
  
> Session storage is visible to applications running on the same protocol, domain, and port. Since this condition is met by all microfrontends of a micro application, session storage is the perfect place for sharing state among microfrontend instances of the same micro application.

1. Open the TypeScript file `activator.ts`.
1. Subscribe to messages published to the topic `shopping-cart/add-product`, as follows:
   ```ts
       import { MessageClient } from '@scion/microfrontend-platform';
       import { Beans } from '@scion/toolkit/bean-manager';
       import { Product, ShoppingCartService } from './shopping-cart-service';
           
       public async init(): Promise<void> {
         // Connect to the platform host
         await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});
 
   [+]   // Listener to add a product to the shopping cart
   [+]   Beans.get(MessageClient)
   [+]     .observe$<Product>('shopping-cart/add-product')
   [+]     .subscribe(msg => {
   [+]       ShoppingCartService.addProduct(msg.body);
   [+]     });
       }
   ```
   > Lines to be added are preceded by the [+] mark.

   Like when publishing a message, you can get a reference to the `MessageClient` using the bean manager of the platform. Using the method `observe$`, you can subscribe to messages published to the passed topic. For more information about cross-application communication, please refer to chapter [Cross Application Communication][link-developer-guide#cross-application-communication] in the Developer Guide.
   
   Each time we add a product to the session storage, the `shopping cart` microfrontend, if open, will update the shopping cart.
</details>

<details>
   <summary><strong>Activator: Navigate to the shopping cart microfrontend</strong></summary>
   <br>

If we recall the implementation of the host application, we notice that we have delegated the routing to show the `shopping cart` microfrontend to the `shopping cart` micro application itself. When the user clicks on the shopping cart button, the host app simply publishes a message to the topic `shopping-cart/toggle-side-panel`. In the activator, we now can receive such messages and navigate accordingly.

1. Open the TypeScript file `activator.ts`.
1. Subscribe to messages published to the topic `shopping-cart/add-product`.
   
   If the shopping cart side panel is currently closed, we will open it, or close it if it is open. Actually, we do not really open or close it, but navigate to the `shopping cart` microfrontend, or perform a `null` navigation to clear the target router outlet. In a member variable, we store whether the panel is closed or opened.
   Also, we open the panel when the user adds a product to the shopping cart.
   
   ```ts
       import { OutletRouter } from '@scion/microfrontend-platform';   

       class Activator {
       
   [+]   private panelVisible: boolean;
       
         public async init(): Promise<void> {
           // Connect to the platform host
           await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});
       
           // Listener to add a product to the shopping cart
           Beans.get(MessageClient)
             .observe$<Product>('shopping-cart/add-product')
             .subscribe(msg => {
               ShoppingCartService.addProduct(msg.body);
   [+]         this.setShoppingCartPanelVisibility(true);
             });
       
   [+]     // Listener to open or close the shopping cart panel
   [+]     Beans.get(MessageClient)
   [+]       .observe$<Product>('shopping-cart/toggle-side-panel')
   [+]       .subscribe(() => this.setShoppingCartPanelVisibility(!this.panelVisible));
         }
       
   [+]   public setShoppingCartPanelVisibility(visible: boolean): void {
   [+]     this.panelVisible = visible;
   [+]     if (visible) {
   [+]       Beans.get(OutletRouter).navigate(`${window.location.origin}/shopping-cart.html`, {outlet: 'SHOPPING-CART'});
   [+]     }
   [+]     else {
   [+]       Beans.get(OutletRouter).navigate(null, {outlet: 'SHOPPING-CART'});
   [+]     }
   [+]   }
       }
   ```
   > Lines to be added are preceded by the [+] mark.
</details>
   
<details>
   <summary><strong>Open the app in the browser</strong></summary>
   <br>

We did it! Run `npm run start` to serve the applications.

If you open the page http://localhost:4200, you should see the webshop in action. The user can add products to the shopping cart, remove all products from the cart and expand or collapse the shopping cart side panel.
</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>
   <br>

In this chapter, we have implemented the `shopping cart` micro application. When the user adds a product to the shopping cart, it is displayed in the `shopping cart` microfrontend. We learned how activators can help us to handle requests even when no user-facing microfrontend of our micro application is running.

<details>
    <summary>The <code>shopping-cart.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Shopping Cart</title>
    <link rel="stylesheet" type="text/css" href="styles.scss">
    <script defer src="./shopping-cart-controller.ts"></script>
  </head>
  <body>
    <h1>Shopping Cart</h1>
    <ul class="cart"></ul>
    <button class="clear">Clear</button>
  </body>
</html>
```   
</details>
<details>
   <summary>The <code>shopping-cart-controller.ts</code> looks as following:</summary>

```ts
import { MicrofrontendPlatform } from '@scion/microfrontend-platform';
import { ShoppingCartService } from './shopping-cart-service';

class ShoppingCartController {

  constructor() {
    document.querySelector('button.clear').addEventListener('click', () => this.onClear());
  }

  public async init(): Promise<void> {
    // Connect to the platform host
    await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});

    // Render products added to the shopping cart
    ShoppingCartService.products$.subscribe(products => {
      const cartElement = document.querySelector('ul.cart');
      cartElement.innerHTML = products
        .map(product => `<li>${product.name}</li>`)
        .join('');
    });
  }

  private onClear(): void {
    ShoppingCartService.clear();
  }
}

new ShoppingCartController().init();
```
</details>
<details>
   <summary>The <code>activator.html</code> looks as following:</summary>
   
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Shopping Cart Activator</title>
    <script defer src="./activator.ts"></script>
  </head>
  <body></body>
</html>
```
</details>
<details>
   <summary>The <code>activator.ts</code> looks as following:</summary>

```ts
import { MessageClient, MicrofrontendPlatform, OutletRouter } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';
import { Product, ShoppingCartService } from './shopping-cart-service';

class Activator {

  private panelVisible: boolean;

  public async init(): Promise<void> {
    // Connect to the platform host
    await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});

    // Listener to add a product to the shopping cart
    Beans.get(MessageClient)
      .observe$<Product>('shopping-cart/add-product')
      .subscribe(msg => {
        ShoppingCartService.addProduct(msg.body);
        this.setShoppingCartPanelVisibility(true);
      });

    // Listener to open or close the shopping cart panel
    Beans.get(MessageClient)
      .observe$<Product>('shopping-cart/toggle-side-panel')
      .subscribe(() => this.setShoppingCartPanelVisibility(!this.panelVisible));
  }

  public setShoppingCartPanelVisibility(visible: boolean): void {
    this.panelVisible = visible;
    if (visible) {
      Beans.get(OutletRouter).navigate(`${window.location.origin}/shopping-cart.html`, {outlet: 'SHOPPING-CART'});
    }
    else {
      Beans.get(OutletRouter).navigate(null, {outlet: 'SHOPPING-CART'});
    }
  }
}

new Activator().init();
```
</details>

<details>
   <summary>The <code>manifest.json</code> looks as following:</summary>

```json
{
  "name": "Shopping Cart App",
  "capabilities": [{
    "type": "activator",
    "private": false,
    "properties": {
      "path": "activator.html"
    }
  }]
}
```
</details>

<details>
   <summary>The <code>shopping-cart-service.ts</code> looks as following:</summary>

```ts
import { fromEvent, merge, Subject } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

/**
 * Key of the shopping cart in the session storage.
 */
const SHOPPING_CART_STORAGE_KEY = 'SHOPPING_CART';
/**
 * Emits when the session storage as been modified in the context of this document.
 */
const localChange$ = new Subject<void>();
/**
 * Emits when the session storage as been modified in the context of another document.
 */
const otherDocumentChange$ = fromEvent<StorageEvent>(window, 'storage')
  .pipe(
    filter(event => event.storageArea === sessionStorage),
    filter(event => event.key === SHOPPING_CART_STORAGE_KEY),
  );

/**
 * Allows adding products to the shopping cart.
 */
export class ShoppingCartService {

  /**
   * Observes products contained in the shopping cart.
   */
  public static products$ = merge(localChange$, otherDocumentChange$)
    .pipe(
      startWith([]),
      map(() => ShoppingCartService.getProducts()),
    );

  /**
   * Adds a product to the shopping cart.
   */
  public static addProduct(product: Product): void {
    const products = ShoppingCartService.getProducts().concat(product);
    ShoppingCartService.setProducts(products);
    localChange$.next();
  }

  /**
   * Removes all products from the shopping cart.
   */
  public static clear(): void {
    ShoppingCartService.setProducts([]);
    localChange$.next();
  }

  private static getProducts(): Product[] {
    const products = sessionStorage.getItem(SHOPPING_CART_STORAGE_KEY);
    return products ? JSON.parse(products) : [];
  }

  private static setProducts(products: Product[]): void {
    sessionStorage.setItem(SHOPPING_CART_STORAGE_KEY, JSON.stringify(products));
    localChange$.next();
  }
}

export interface Product {
  id: number;
  name: string;
}
```
</details>
</details>

<details>
   <summary><strong>Further reading</strong></summary>
   <br>
   
   In the course of this Getting Started Guide, we have covered only a subset of the functionality of the SCION Microfrontend Platform. Please read the [Developer Guide][link-developer-guide] for a complete overview of features and more in-depth information about its core concepts and API.
   
   If you have questions, miss features, or would like to report a bug, please don't hesitate to contact us via [GitHub issues][link-issues].
</details>
   
[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[menu-getting-started]: /docs/site/getting-started/getting-started.md
[link-getting-started:host-app]: /docs/site/getting-started/getting-started-host-app.md
[link-getting-started#installation]: /docs/site/getting-started/getting-started.md#how-to-complete-this-guide
[link-developer-guide]: https://scion-microfrontend-platform-developer-guide.now.sh
[link-developer-guide#activator]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:activator
[link-developer-guide#capability]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:intention-api:capability
[link-developer-guide#activator:state-sharing]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:activator:sharing-state
[link-developer-guide#cross-application-communication]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:cross
[link-developer-guide#manifest]: https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:intention-api:manifest-application-communication
[link-issues]: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues
