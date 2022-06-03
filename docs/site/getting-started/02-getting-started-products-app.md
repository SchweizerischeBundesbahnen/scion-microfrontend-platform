<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > [Getting Started][menu-getting-started] > Create Products Application

The products micro app provides two microfrontends, the *ProductList Microfrontend* that lists our products, and the *Product Microfrontend* that displays a product.

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
   
If you checked out the `skeleton` branch of the Git repository for this guide, the directory structure should look like this. If not, please refer to [How to complete this guide][link-getting-started#installation] for step-by-step instructions.

```
   scion-microfrontend-platform-getting-started
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
   │   │   ├── product.data.json // Sample data
   │   │   ├── product.service.ts // Service to access sample data
   │   │   └── query-params.ts
   │   ├── package.json
   │   └── tsconfig.json
```
</details>

 
Follow the following instructions to get the *Products App* running.

<details>
  <summary><strong>Start the *Products App*</strong></summary>

Run `npm run start` to start the application. Then open the page http://localhost:4201 in your browser. You should see two links to open the *ProductList Microfrontend* and *Product Microfrontend*. When you click on a link, the particular microfrontend opens, but does not show much yet, only its title.

By the end of this chapter, the *ProductList Microfrontend* will list our products. When clicking on a product link, we can navigate to the *Product Microfrontend* to see details about the product.

</details>

<details>
  <summary><strong>Implement the *ProductList Microfrontend*</strong></summary>

In this section, we will implement the *ProductList Microfrontend* that lists our products.

1. Open the HTML template `products-app/src/product-list/product-list.html`.
2. After the `<h1>` element, add a section to display our products, as follows:
   ```html
         <body>
           <h1>Products</h1>
   [+]     <section id="products"></section>
         </body> 
   ```
3. Open the TypeScript file `products-app/src/product-list/product-list.ts` and add the following method after the `init` method. This method will render products of given IDs. 

   ```ts
         import {ProductService} from '../product.service';
   
         public render(ids?: string[]): void {
           const productsSection = document.querySelector('section#products');
           productsSection.innerHTML = null;
         
           ProductService.INSTANCE.getProducts({ids}).forEach(product => {
             // Product Name
             const productLink = productsSection.appendChild(document.createElement('a'));
             productLink.innerText = product.name;
             productLink.href = `/product/product.html#?id=${product.id}`;
         
             // Product Price
             productsSection.appendChild(document.createTextNode(`$ ${product.price.toFixed(2)}`));
           });
         }
   ```
   We need a reference to the `<section>` element that we added to the template in the previous step. Our products will be added to this section. Since the `render` method is called every time the products to be displayed change, we clear the section's content first. Then, using the `ProductService`, we query the products of given IDs. For each product, we create an anchor element, that when clicked, navigates to the *Product Microfrontend* located at `/product/product.html`. We pass the ID of the product in the form of a query parameter. Note that we added the query parameter to the URL's fragment part, that is after the hash (`#`), so that the page is not reloaded when the query parameter is changed. This is similar to hash-based routing, but it only applies to query parameters. Finally, after the link, we append a text node to display the price of the product.
4. In the `init` method, subscribe to query parameter changes and invoke the `render` method, passing the `ids` as argument. The `ids` query parameter contains the IDs of the products to be displayed as a comma-separated list.

   ```ts
         import {ProductService} from '../product.service';
   [+]   import {QueryParams} from '../query-params';

         public async init(): Promise<void> {
   [+]     QueryParams.observe$.subscribe(queryParams => {
   [+]       const productIds = queryParams.get('ids')?.split(',');
   [+]       this.render(productIds);
   [+]     });
         }
   ```

</details>

<details>
  <summary><strong>Implement the *Product Microfrontend*</strong></summary>

In this section, we will implement the *Product Microfrontend* to display a product.

1. Open the HTML template `products-app/src/product/product.html`.
2. After the `<h1>` element, add a section to display the product, as follows:
   ```html
         <body>
           <h1>Product</h1>
   [+]     <section id="product"></section>
         </body> 
   ```
3. Open the TypeScript file `products-app/src/product/product.ts`.
   
   Add a `render` method after the `init` method to render the product of given ID, as follows: 

   ```ts
         import {ProductService} from '../product.service';

         public render(productId: string): void {
           const productSection = document.querySelector('section#product');
           const product = ProductService.INSTANCE.getProduct(productId);
         
           productSection.innerHTML = null;
         
           // Name
           productSection.appendChild(document.createElement('label')).innerText = 'Name:';
           productSection.appendChild(document.createTextNode(product.name));
         
           // Price
           productSection.appendChild(document.createElement('label')).innerText = 'Price:';
           productSection.appendChild(document.createTextNode(`$ ${product.price.toFixed(2)}`));
         }
   ```
   We need a reference to the `<section>` element that we added to the template in the previous section. The product will be added to this section. Since the `render` method is called every time the product to be displayed change, we clear the section's content first. Finally, using the `ProductService`, we look up the product of given ID and display its name and price.

4. In the `init` method, subscribe to query parameter changes and invoke the `render` method, passing the `id` as argument. The `id` query parameter contains the ID of the product to be displayed.

   ```ts
         import {ProductService} from '../product.service';
   [+]   import {QueryParams} from '../query-params';

         public async init(): Promise<void> {
   [+]     QueryParams.observe$.subscribe(queryParams => this.render(queryParams.get('id')));
         }
   ```
</details>

<details>
   <summary><strong>Open the app in the browser</strong></summary>

We did it! Run `npm run start` to serve the applications.

When you open the page http://localhost:4200 in your browser and click the `Products` button, you will see the *ProductList Microfrontend*. When clicking on a product, the *Product Microfrontend* opens, displaying information about the product. So far, the *Product Microfrontend* replaces the *ProductList Microfrontend*. In a subsequent chapter, we will display the product to the right of the product list in the `aside` router outlet.

</details>

<details>
   <summary><strong>What we did in this chapter</strong></summary>

In this chapter, we have implemented the *ProductList Microfrontend* and *Product Microfrontend* of the *Products App*.

<details>
   <summary>The <code>products-app/src/product-list/product-list.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Products</title>
    <link rel="stylesheet" type="text/css" href="product-list.scss">
    <script type="module" src="./product-list.ts"></script>
  </head>
  <body>
    <h1>Products</h1>
    <section id="products"></section>
  </body>
</html>
```
</details>

<details>
   <summary>The <code>products-app/src/product-list/product-list.ts</code> looks as following:</summary>

```ts
import {ProductService} from '../product.service';
import {QueryParams} from '../query-params';

class ProductListController {

  public async init(): Promise<void> {
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
      productLink.href = `/product/product.html#id=${product.id}`;

      // Product Price
      productsSection.appendChild(document.createTextNode(`$ ${product.price.toFixed(2)}`));
    });
  }
}

new ProductListController().init();
```
</details>

<details>
   <summary>The <code>products-app/src/product/product.html</code> looks as following:</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Product</title>
    <link rel="stylesheet" type="text/css" href="product.scss">
    <script type="module" src="./product.ts"></script>
  </head>
  <body>
    <h1>Product</h1>
    <section id="product"></section>
  </body>
</html>
```
</details>

<details>
   <summary>The <code>products-app/src/product/product.ts</code> looks as following:</summary>

```ts
import {ProductService} from '../product.service';
import {QueryParams} from '../query-params';

class ProductController {

  public async init(): Promise<void> {
    QueryParams.observe$.subscribe(queryParams => this.render(queryParams.get('id')));
  }

  public render(productId: string): void {
    const productSection = document.querySelector('section#product');
    const product = ProductService.INSTANCE.getProduct(productId);

    productSection.innerHTML = null;

    // Name
    productSection.appendChild(document.createElement('label')).innerText = 'Name:';
    productSection.appendChild(document.createTextNode(product.name));

    // Price
    productSection.appendChild(document.createElement('label')).innerText = 'Price:';
    productSection.appendChild(document.createTextNode(`$ ${product.price.toFixed(2)}`));
  }
}

new ProductController().init();
```
</details>

</details>

<details>
   <summary><strong>What's next</strong></summary>

In the next chapter, we will develop the *Customers App*. Click [here][link-getting-started:03:customers-app] to continue.
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

