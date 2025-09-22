import {Capability, CapabilityInterceptor, Intent, IntentClient, IntentMessage, IntentSelector, ManifestObjectFilter, ManifestService, MicrofrontendPlatformHost} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

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
      "description": "Microfrontend to display a product.",
      "type": "microfrontend",
      "qualifier": {
        "entity": "product"
      }
      "params": [
        {"name":"id", "required": true},
      ],
      "properties": {
        "path": "/products/:id",
      }
    }
  ],
  "intentions": [
    {
      "type": "microfrontend",
      "qualifier": {
        "entity": "customer-review"
      }
    }
  ]
}
// end::manifest[]
`;

`
// tag::capability-declaration[]
{
  "description": "Sensor to adjust the room temperature in the kitchen.", 
  "type": "temperature",
  "qualifier": {
    "room": "kitchen"
  },
  "params": [
    {"name":"authorization", "required": false},
  ],
  "private": false,
  "properties": {
    "floor": "first floor",
  }
}
// end::capability-declaration[]
`;

`
// tag::intention-declaration[]
{
  "type": "temperature",
  "qualifier": {
    "room": "kitchen"
  }
}
// end::intention-declaration[]
`;

{
// tag::intent-handling[]
  const selector: IntentSelector = {
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => {
    // handle the intent
  });
// end::intent-handling[]
}

{
// tag::publish-intent[]
  const intent: Intent = {
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  Beans.get(IntentClient).publish(intent, '22°C');
// end::publish-intent[]
}

{
// tag::publish-intent-with-params[]
  const intent: Intent = {
    type: 'temperature',
    qualifier: {room: 'kitchen'},
    params: new Map().set('authorization', 'Bearer <token>')
  };

  Beans.get(IntentClient).publish(intent, '22°C');
// end::publish-intent-with-params[]
}

{
// tag::capability-lookup-toolbar-items[]
  // Filter toolbar item capabilities.
  const toolbarItemFilter: ManifestObjectFilter = {
    type: 'menu-item',
    qualifier: {
      location: 'toolbar:main',
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
      type: 'notification',
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
  const filter: ManifestObjectFilter = {type: 'notification'};
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
  MicrofrontendPlatformHost.start({
    applications: [
      {
        symbolicName: 'product-catalog-app',
        manifestUrl: 'https://product-catalog.webshop.io/manifest.json',
        intentionRegisterApiDisabled: false, // <1>
      },
    ],
  });
  // end::enable-intention-register-api[]
}

function hash(capability: Capability): string {
  return null;
}

{
  // tag::intercept-capability[]
  class MicrofrontendCapabilityInterceptor implements CapabilityInterceptor {

    public async intercept(capability: Capability): Promise<Capability> {
      if (capability.type === 'microfrontend') {
        return {
          ...capability,
          metadata: {...capability.metadata, id: hash(capability)},
        };
      }
      return capability;
    }
  }
  // end::intercept-capability[]

  // tag::intercept-capability:manifest[]
  class UserCapabilityMigrator implements CapabilityInterceptor {

    public async intercept(capability: Capability, manifest: CapabilityInterceptor.Manifest): Promise<Capability> {
      if (capability.type === 'user' && capability.properties['info']) {
        // Move user info to new capability.
        await manifest.addCapability({
          type: 'user-info',
          properties: {
            ...capability.properties['info'],
          },
        });
        // Remove info on intercepted capability.
        delete capability.properties['info'];
      }
      return capability;
    }
  }
  // end::intercept-capability:manifest[]

  // tag::register-capability-interceptor[]
  Beans.register(CapabilityInterceptor, {useClass: MicrofrontendCapabilityInterceptor, multi: true}); // <1>
  Beans.register(CapabilityInterceptor, {useClass: UserCapabilityMigrator, multi: true}); // <1>

  // Start the platform.
  MicrofrontendPlatformHost.start(...); // <2>
  // end::register-capability-interceptor[]
}
