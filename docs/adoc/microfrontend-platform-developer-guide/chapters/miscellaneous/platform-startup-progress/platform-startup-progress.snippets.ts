import { MicrofrontendPlatform } from '@scion/microfrontend-platform';

{
  // tag::platform-lifecycle:startupProgress[]
  // invoke just before starting the SCION Microfrontend Platform
  MicrofrontendPlatform.startupProgress$.subscribe((progress: number) => {
    // Update your progress indicator here.
    // The reported progress is a percentage number between `0` and `100`.
  });
  // end::platform-lifecycle:startupProgress[]
}
