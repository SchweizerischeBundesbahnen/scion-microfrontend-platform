import { IntentClient, IntentMessage, IntentSelector, ManifestObjectFilter, ManifestService, MicrofrontendPlatform } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';

// tslint:disable:no-unused-expression
`
// tag::manifest[]
{
  "name": "Product Catalog Application",
  "baseUrl": "#",
  "capabilities": [
    {
      "description": "Shows the product list microfrontend.",
      "type": "microfrontend",
      "qualifier": {
        "entity": "product-list"
      }
      "properties": {
        "path": "/products",
      }
    },
    {
      "description": "Shows the product detail microfrontend.",
      "type": "microfrontend",
      "qualifier": {
        "entity": "product",
        "id": "*",
      }
      "properties": {
        "path": "/products/:id",
      }
    }
  ],
  "intentions": [
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "customer-review",
        "productId": "*"
      }
    }
  ]
}
// end::manifest[]
`;

`
// tag::capability-declaration[]
{
  "description": "Shows the product microfrontend.",
  "type": "microfrontend",
  "qualifier": {
    "entity": "product",
    "id": "*",
  },
  "properties": {
    "path": "/products/:id",
  }
}
// end::capability-declaration[]
`;

`
// tag::intention-declaration[]
{
  "type": "microfrontend",
  "qualifier": {
    "entity": "product",
    "id": "*"
  }
}
// end::intention-declaration[]
`;

{
// tag::intent-handling[]
  const selector: IntentSelector = {
    type: 'microfrontend',
    qualifier: {entity: 'product', id: '*'},
  };

  Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => {
    // handle the intent
  });
// end::intent-handling[]
}

{
// tag::issue-intent[]
  Beans.get(IntentClient).publish({
    type: 'microfrontend',
    qualifier: {
      entity: 'product',
      productId: '500f3dba-a638-4d1c-a73c-d9c1b6a8f812',
    },
  });
// end::issue-intent[]
}

{
// tag::capability-lookup-toolbar-items[]
  // Filter toolbar item capabilities.
  const toolbarItemFilter: ManifestObjectFilter = {
    type: 'toolbar-item',
    qualifier: {
      toolbar: 'main',
      action: '*',
    },
  };

  Beans.get(ManifestService).lookupCapabilities$(toolbarItemFilter).subscribe(toolbarItems => { // <1>
    // Clear toolbar list.
    const toolbarElement = document.querySelector('ul.toolbar.main');
    toolbarElement.innerHTML = '';

    // For each toolbar item capability, create a toolbar list item.
    toolbarItems.forEach(toolbarItem => {
      const toolbarItemElement = toolbarElement.appendChild(document.createElement('li'));

      // Set the label as specified in the capability properties.
      toolbarItemElement.innerText = toolbarItem.properties.label;

      // Issue an intent when clicking the toolbar item.
      toolbarItemElement.addEventListener('click', () => {
        const intent = {type: toolbarItem.type, qualifier: toolbarItem.qualifier};
        Beans.get(IntentClient).publish(intent);  // <2>
      });
    });
  });
// end::capability-lookup-toolbar-items[]
}

{
  void async function() {
    // tag::capability-register-notification[]

    // Inform the user about planned maintenance.
    const capabilityId = await Beans.get(ManifestService).registerCapability({ // <1>
      type: 'user-notification',
      description: 'Informs the user about planned system maintenance',
      private: false,
      properties: {
        service: 'Payment',
        message: `Due to planned system maintenance, paying by credit card on this Sunday, 29 August,
                  between 22:00 and 23:00 CET is not possible. Thank you for your understanding.`,
      },
    });

    // Clear the notification after 30 seconds.
    setTimeout(() => {
      Beans.get(ManifestService).unregisterCapabilities({id: capabilityId}); // <2>
    }, 30000);
    // end::capability-register-notification[]
  };
}

{
// tag::capability-lookup-notification[]
  const filter: ManifestObjectFilter = {type: 'user-notification'};
  Beans.get(ManifestService).lookupCapabilities$(filter).subscribe(notifications => { // <1>
    // Clear present notifications.
    const notificationList = document.querySelector('ul.notifications');
    notificationList.innerHTML = '';

    // Show each notification to the user.
    notifications.forEach(notification => {
      const notificationElement = notificationList.appendChild(document.createElement('li'));
      notificationElement.innerText = `${notification.properties.service}:
                                       ${notification.properties.message}`; // <2>
    });
  });
// end::capability-lookup-notification[]
}

{
  // tag::enable-intention-register-api[]
  MicrofrontendPlatform.startHost({
    apps: [
      {
        symbolicName: 'product-catalog-app',
        manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
        intentionRegisterApiDisabled: false, // <1>
      },
    ],
  });
  // end::enable-intention-register-api[]
}
