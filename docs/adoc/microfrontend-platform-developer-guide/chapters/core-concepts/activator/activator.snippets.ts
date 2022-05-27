import { ACTIVATION_CONTEXT, ActivationContext, Capability, ContextService, Intent, IntentClient, IntentMessage, IntentSelector, ManifestService, MessageClient, OutletRouter } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';

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
    const properties = ctx.activator.properties;
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
