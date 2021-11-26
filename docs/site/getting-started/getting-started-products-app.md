<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Products Application

The products applications presents a list of products that the user can add to the shopping cart. 

***
- **Project directory:**\
  scion-microfrontend-platform-getting-started/products-app
- **Installing modules (if not already done):**\
  `npm run install`
- **Starting the app:**\
  `npm run start`
- **Opening the app in the browser:**\
  http://localhost:4201
***


<details>
   <summary><strong>Prerequisites</strong></summary>
   <br>
   
If you checked out the `skeleton` branch of the Git repository for this guide, the directory structure should look like this. If not, please refer to [How to complete this guide][link-getting-started#installation] for step-by-step instructions.

```
   scion-microfrontend-platform-getting-started
   ├── products-app
   │   ├── src
   │   │   ├── products.html // HTML template
   │   │   ├── products-controller.ts // TypeScript file
   │   │   └── styles.scss // Sass stylesheet
   │   ├── package.json
   │   └── tsconfig.json
```
</details>

 
Follow the following instructions to get the `products` micro application running.

<details>
   <summary><strong>Connect to the platform host</strong></summary>
   <br>

In this section, we will connect the `products` micro application to the platform host.

1. Open the TypeScript file `products-controller.ts`.
1. Connect to the platform host by adding the following content to the `init` method, as follows:
   ```ts
        import { MicrofrontendPlatform } from '@scion/microfrontend-platform';   
   
        public async init(): Promise<void> {
   [+]    await MicrofrontendPlatform.connectToHost('products-app');
        }   
   ```
   > Lines to be added are preceded by the [+] mark.   
   
   The only argument we pass is our identity. The platform host then checks whether we are a registered micro application. It also checks our origin, i.e., that our origin matches the manifest origin. This check prevents other micro applications from connecting to the platform on behalf of us.
1. Next, we provide the manifest JSON file that we registered in the host application in the [Getting Started for the Host Application][link-getting-started:host-app].

   Create the file `manifest.json` in the `src` folder, as follows:
   ```json
   {
     "name": "Products Application"
   }
   ```
   
   To learn more about the manifest, refer to the [Developer Guide][link-developer-guide#manifest].
   
   > This step requires to serve the application anew.
</details>

<details>
   <summary><strong>Show the products</strong></summary>
   <br>

In this section, we will render products in an unordered list.

1. Open the HTML template `products.html`.
1. Add an empty, unordered list after the heading element and decorate it with the CSS class `products`, as follows:
   ```html
   <ul class="products"></ul>
   ```
1. Open the TypeScript file `products-controller.ts`.
1. Create an interface to represent a product, as follows:
   ```ts
   interface Product {
     id: number;
     name: string;
   }
   ```
   You can place this interface at the end of the `products-controller.ts` file.
1. Create the products array as private member before the constructor, as follows:
   ```ts
   private products: Product[] = [
     {id: 1, name: 'Product 1'},
     {id: 2, name: 'Product 2'},
     {id: 3, name: 'Product 3'},
     {id: 4, name: 'Product 4'},
     {id: 5, name: 'Product 5'},
   ];
   ```  
1. Create a method to render a list item for a product, as follows:
   ```ts
   private renderProduct(product: Product): void {
     const ul = document.querySelector('ul.products');
     const li = document.createElement('li');
     const text = document.createTextNode(product.name);
     const button = document.createElement('button');
 
     button.innerText = 'Add to cart';
     button.addEventListener('click', () => this.onAddToCart(product));
 
     ul.appendChild(li);
     li.appendChild(text);
     li.appendChild(button);
   }
   ```
1. In the `init` method, iterate through the products and render them, as follows:
   ```ts
        public async init(): Promise<void> {
          // Connect to the platform host
          await MicrofrontendPlatform.connectToHost('products-app');

   [+]    // Render the products
   [+]    this.products.forEach(product => this.renderProduct(product));
        }    
   ```
   > Lines to be added are preceded by the [+] mark.
1. Allow the user to add products to the shopping cart.

   As you may have noticed, we have added an 'Add to cart' button to each product. We further registered a click event handler that calls the `onAddToCart` method when the user clicks on that button.
   Next, we add the missing method to the controller, as follows:
   ```ts
   import { MessageClient } from '@scion/microfrontend-platform';
   import { Beans } from '@scion/toolkit/bean-manager';
   
   private onAddToCart(product: Product): void {
     Beans.get(MessageClient).publish('shopping-cart/add-product', product);
   }   
   ```
   
   When this method is called, we publish a message to the topic `shopping-cart/add-product` to signal (the shopping cart application) that the user wants to add a product to the shopping cart. As of now, nothing would happen when the user clicks on that button, because we did not register a message listener yet. It is important to understand that the platform transports that message to all micro applications. Later, when implementing the `shopping cart` micro application, we will subscribe to such messages and add the product to the shopping cart.

</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>
   <br>

We did it! Run `npm run start` to serve the applications.

If you open the page http://localhost:4200, you should now see the `products` microfrontend. But adding products to the shopping cart does not work yet, because we still have not implemented the `shopping cart` micro application.
</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>
   <br>

In this chapter, we have implemented the `products` micro application to display the product list in a microfrontend. We have added a button to each product, allowing the user to add it to the shopping cart. When the user clicks that button, we publish a message to the topic `shopping-cart/add-product`. Later, the `shopping cart` micro application will subscribe to such messages and take the necessary actions.

<details>
   <summary>The <code>products.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Products</title>
    <link rel="stylesheet" type="text/css" href="styles.scss">
    <script defer src="./products-controller.ts"></script>
  </head>
  <body>
    <h1>Products</h1>
    <ul class="products"></ul>
  </body>
</html>
```
</details>

<details>
   <summary>The <code>products-controller.ts</code> looks as following:</summary>

```ts
import { MessageClient, MicrofrontendPlatform } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';

class ProductsController {

  private products: Product[] = [
    {id: 1, name: 'Product 1'},
    {id: 2, name: 'Product 2'},
    {id: 3, name: 'Product 3'},
    {id: 4, name: 'Product 4'},
    {id: 5, name: 'Product 5'},
  ];

  public async init(): Promise<void> {
    // Connect to the platform host
    await MicrofrontendPlatform.connectToHost('products-app');

    // Render the products
    this.products.forEach(product => this.renderProduct(product));
  }

  private onAddToCart(product: Product): void {
    // Notify the shopping cart application when the user adds a product to the shopping cart
    Beans.get(MessageClient).publish('shopping-cart/add-product', product);
  }

  private renderProduct(product: Product): void {
    const ul = document.querySelector('ul.products');
    const li = document.createElement('li');
    const text = document.createTextNode(product.name);
    const button = document.createElement('button');

    button.innerText = 'Add to cart';
    button.addEventListener('click', () => this.onAddToCart(product));

    ul.appendChild(li);
    li.appendChild(text);
    li.appendChild(button);
  }
}

new ProductsController().init();

interface Product {
  id: number;
  name: string;
}
```
</details>

<details>
   <summary>The <code>manifest.json</code> looks as following:</summary>

```json
{
  "name": "Products Application"
}
```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>
   <br>

   Next, we will develop the `shopping cart` micro application so that the user can add products into the shopping cart. Click [here][link-getting-started:shopping-cart-app] to continue. 
</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[menu-getting-started]: /docs/site/getting-started/getting-started.md
[link-getting-started:host-app]: /docs/site/getting-started/getting-started-host-app.md
[link-getting-started:shopping-cart-app]: /docs/site/getting-started/getting-started-shopping-cart-app.md
[link-getting-started#installation]: /docs/site/getting-started/getting-started.md#how-to-complete-this-guide
[link-developer-guide#manifest]: https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:intention-api:manifest
