import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatform, MicrofrontendPlatformStopper, PlatformState} from '@scion/microfrontend-platform';

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
  MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
    // invoked when the platform is about to start.
  });

  MicrofrontendPlatform.whenState(PlatformState.Started).then(() => {
    // invoked after the platform is started
  });

  MicrofrontendPlatform.whenState(PlatformState.Stopping).then(() => {
    // invoked when the platform is about to stop.
  });

  MicrofrontendPlatform.whenState(PlatformState.Stopped).then(() => {
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
  class BeforeUnloadMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper {

    constructor() {
      // Destroys the platform when the document is about to be unloaded.
      window.addEventListener('beforeunload', () => MicrofrontendPlatform.destroy(), {once: true});
    }
  }

  // Registers custom platform stopper.
  Beans.register(MicrofrontendPlatformStopper, {useClass: BeforeUnloadMicrofrontendPlatformStopper});
  // end::platform-lifecycle:microfrontend-platform-stopper[]
}

{
  // tag::platform-lifecycle:startupProgress[]
  // Invoke just before starting the SCION Microfrontend Platform.
  MicrofrontendPlatform.startupProgress$.subscribe((progress: number) => {
    // Update your progress indicator here.
    // The reported progress is a percentage number between `0` and `100`.
  });
  // end::platform-lifecycle:startupProgress[]
}

