import {Capability, HostManifestInterceptor, Intention, Manifest} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

{
  // tag::interceptor[]
  class YourInterceptor implements HostManifestInterceptor {

    public intercept(hostManifest: Manifest): void {
      hostManifest.intentions = [
        ...hostManifest.intentions || [],
        provideMicrofrontendIntention(), // <1>
      ];
      hostManifest.capabilities = [
        ...hostManifest.capabilities || [],
        provideMessageBoxCapability(), // <2>
      ];
    }
  }

  function provideMicrofrontendIntention(): Intention {
    return {
      type: 'microfrontend',
      qualifier: {'*': '*'},
    };
  }

  function provideMessageBoxCapability(): Capability {
    return {
      type: 'messagebox',
      qualifier: {},
      private: false,
      description: 'Allows displaying a simple message to the user.',
    };
  }

  // end::interceptor[]

  // tag::register-interceptor[]
  Beans.register(HostManifestInterceptor, {useClass: YourInterceptor, multi: true});
  // end::register-interceptor[]
}
