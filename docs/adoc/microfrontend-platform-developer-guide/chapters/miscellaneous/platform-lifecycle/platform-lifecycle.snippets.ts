import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatform, MicrofrontendPlatformHost, MicrofrontendPlatformStopper, PlatformState} from '@scion/microfrontend-platform';

{
  // tag::platform-lifecycle:registerInitializer[]
  Beans.registerInitializer({
    useFunction: async () => {
      // do some initialization in runlevel 4
    },
    runlevel: 4,
  });
  // end::platform-lifecycle:registerInitializer[]
}

{
  // tag::platform-lifecycle:when-state[]
  MicrofrontendPlatform.onState(PlatformState.Starting, () => {
    // invoked when the platform is about to start.
  });

  MicrofrontendPlatform.onState(PlatformState.Started, () => {
    // invoked after the platform is started
  });

  MicrofrontendPlatform.onState(PlatformState.Stopping, () => {
    // invoked when the platform is about to stop.
  });

  MicrofrontendPlatform.onState(PlatformState.Stopped, () => {
    // invoked when the platform is stopped.
  });
  // end::platform-lifecycle:when-state[]
}

{
  // tag::platform-lifecycle:bean-pre-destroy-hook[]
  class Bean implements PreDestroy {

    public preDestroy(): void {
      // invoked when the platform is about to stop.
    }
  }

  // end::platform-lifecycle:bean-pre-destroy-hook[]
}

{
  // tag::platform-lifecycle:microfrontend-platform-stopper[]
  class CustomMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper {

    constructor() {
      // Destroys the platform before the document is unloaded.
      window.addEventListener('beforeunload', () => MicrofrontendPlatform.destroy());
    }
  }

  // Registers custom platform stopper.
  Beans.register(MicrofrontendPlatformStopper, {useClass: CustomMicrofrontendPlatformStopper});
  // end::platform-lifecycle:microfrontend-platform-stopper[]
}

{
  // tag::platform-lifecycle:startupProgress[]
  // Invoke just before starting the SCION Microfrontend Platform.
  MicrofrontendPlatformHost.startupProgress$.subscribe((progress: number) => {
    // Update your progress indicator here.
    // The reported progress is a percentage number between `0` and `100`.
  });
  // end::platform-lifecycle:startupProgress[]
}

