import { Beans } from '@scion/toolkit/bean-manager';
import { MicrofrontendPlatform, PlatformState } from '@scion/microfrontend-platform';

{
  // tag::platform-lifecycle:registerInitializer[]
  Beans.registerInitializer({
    useFunction: async () => {
      // do some initialization in runlevel 3
    },
    runlevel: 3,
  });
  // end::platform-lifecycle:registerInitializer[]
}

{
  // tag::platform-lifecycle:when-state-started[]
  MicrofrontendPlatform.whenState(PlatformState.Started).then(() => {
    // invoked after the platform started
  });
  // end::platform-lifecycle:when-state-started[]
}
