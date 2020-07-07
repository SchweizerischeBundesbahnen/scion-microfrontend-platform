import { ACTIVATION_CONTEXT, ActivationContext, Beans, Capability, ContextService, Intent, IntentMessage, IntentSelector, ManifestService, MessageClient, OutletRouter } from '@scion/microfrontend-platform';

`
// tag::register-activator[]
"capabilities": [
  {
    "type": "activator", // <1>
    "private": false, // <2>
    "properties": {
      "path": "path/to/the/activator" // <3>
    }
  }
]
// end::register-activator[]
`;

`
// tag::register-activator-with-readiness-topic[]
"capabilities": [
  {
    "type": "activator",
    "private": false,
    "properties": {
      "path": "path/to/the/activator",
      "readinessTopics": ["app/activator/ready"] // <1>
    }
  }
]
// end::register-activator-with-readiness-topic[]
`;

{
  async function asyncFunction(): Promise<void> {
    // tag::activation-context[]
    // Checks if running in an activation context.
    const isPresent = await Beans.get(ContextService).isPresent(ACTIVATION_CONTEXT);

    // Looks up the activation context.
    const ctx: ActivationContext = await Beans.get(ContextService).lookup(ACTIVATION_CONTEXT);

    // Reads properties declared on the activator capability.
    const properties = ctx.activator.properties
    // end::activation-context[]
  }
}

{
  async function asyncFunction(): Promise<void> {
    // tag::activation-context:primary[]
    // Looks up the activation context.
    const ctx = await Beans.get(ContextService).lookup<ActivationContext>(ACTIVATION_CONTEXT);

    // Checks if running in the context of the primary activator.
    const isPrimary: boolean = ctx.primary;
    // end::activation-context:primary[]
  }
}

{
  // tag::signal-readiness[]
  Beans.get(MessageClient).publish('app/activator/ready');
  // end::signal-readiness[]
}

{
  async function asyncFunctionSignalReadiness(): Promise<void> {
    // tag::signal-readiness:read-topic-from-capability[]
    // Looks up the activation context.
    const activationContext = await Beans.get(ContextService).lookup<ActivationContext>(ACTIVATION_CONTEXT);

    // Read the configured readiness topic from the activator capability.
    Beans.get(MessageClient).publish(activationContext.activator.properties.readinessTopics as string);
    // end::signal-readiness:read-topic-from-capability[]
  }
}

{
  void async function() {
    // tag::contribute-capability-in-activator[]

    // Declare the capability to inform the user about planned maintenance
    const notifyCapability: Capability = {
      type: 'user-notification',
      description: 'Informs the user about planned system maintenance',
      private: false,
      properties: {
        service: "Payment",
        message: `Due to planned system maintenance, paying by credit card on this Sunday, 29 August,
                  between 22:00 and 23:00 CET is not possible. Thank you for your understanding.`,
      },
    };

    // Register the capability in the platform.
    const capabilityId = await Beans.get(ManifestService).registerCapability(notifyCapability);

    // Unregister the capability after 30 seconds.
    setTimeout(() => {
      Beans.get(ManifestService).unregisterCapabilities({id: capabilityId});
    }, 30000);
    // end::contribute-capability-in-activator[]
  };
}

`
// tag::microfrontend-capability[]
  "capabilities": [
    {
      "description": "Shows the product microfrontend.",
      "type": "microfrontend", // <1>
      "qualifier": {
        "entity": "product",
        "id": "*" // <2>
      },
      "private": false, // <3>
      "properties": {
        "path": "/products/:id" // <4>
      }
    }
  ]
// end::microfrontend-capability[]
`;

{
  // tag::microfrontend-routing[]
  const selector: IntentSelector = {
    type: 'microfrontend',
    qualifier: {entity: 'product', id: '*'},
  };

  Beans.get(MessageClient).onIntent$(selector).subscribe((message: IntentMessage) => {
    const outlet = message.headers.get('outlet');  // <1>
    const microfrontendPath = message.capability.properties.path; // <2>

    // Instruct the target outlet to display the microfrontend.
    Beans.get(OutletRouter).navigate(microfrontendPath, {
      outlet: outlet, // <3>
      params: message.intent.qualifier, // <4>
    });
  });
  // end::microfrontend-routing[]
}

{
  // tag::issue-microfrontend-intent[]
  const intent: Intent = { // <1>
    type: 'microfrontend',
    qualifier: {entity: 'product', id: '123'},
  };
  const headers = new Map().set('outlet', 'aside'); // <2>

  Beans.get(MessageClient).issueIntent(intent, null, {headers}); // <3>
  // end::issue-microfrontend-intent[]
}
