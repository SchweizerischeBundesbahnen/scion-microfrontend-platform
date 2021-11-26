import {Intention, Manifest, PlatformCapabilityTypes} from '../platform.model';
import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Hook to intercept the host manifest before it is registered in the platform.
 *
 * If integrating the platform in a library, you may need to intercept the manifest of the host in order to introduce library-specific behavior.
 *
 * You can register the interceptor in the bean manager, as follows:
 *
 * ```ts
 * Beans.register(HostManifestInterceptor, {useClass: YourInterceptor, multi: true});
 * ```
 *
 * The interceptor may look as following:
 * ```ts
 *  class YourInterceptor implements HostManifestInterceptor {
 *
 *   public intercept(hostManifest: Manifest): void {
 *     hostManifest.intentions = [
 *       ...hostManifest.intentions || [],
 *       provideMicrofrontendIntention(),
 *     ];
 *     hostManifest.capabilities = [
 *       ...hostManifest.capabilities || [],
 *       provideMessageBoxCapability(),
 *     ];
 *   }
 * }
 *
 * function provideMicrofrontendIntention(): Intention {
 *    return {
 *      type: 'microfrontend',
 *      qualifier: {'*': '*'},
 *    };
 *  }
 *
 * function provideMessageBoxCapability(): Capability {
 *    return {
 *      type: 'messagebox',
 *      qualifier: {},
 *      private: false,
 *      description: 'Allows displaying a simple message to the user.',
 *    };
 *  }
 *
 * ```
 */
export abstract class HostManifestInterceptor {

  /**
   * Allows modifying the host manifest before it is registered in the platform, e.g., to register capabilities or intentions.
   */
  public abstract intercept(hostManifest: Manifest): void;
}

/**
 * Intercepts the host manifest, registering platform-specific intentions and capabilities.
 *
 * @internal
 */
export class ɵHostManifestInterceptor implements HostManifestInterceptor {

  public intercept(hostManifest: Manifest): void {
    hostManifest.intentions = [
      ...hostManifest.intentions || [],
      ...provideActivatorIntentionIfEnabled(),
    ];
  }
}

/**
 * Provides a wildcard activator intention for the platform to read activator capabilities for installing activator microfrontends.
 */
function provideActivatorIntentionIfEnabled(): Intention[] {
  const activatorApiDisabled = Beans.get(MicrofrontendPlatformConfig).activatorApiDisabled ?? false;
  if (activatorApiDisabled) {
    return [];
  }
  return [{
    type: PlatformCapabilityTypes.Activator,
    qualifier: {'*': '*'},
  }];
}
