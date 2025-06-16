import {EnvironmentProviders, InjectionToken, Injector, makeEnvironmentProviders, runInInjectionContext} from '@angular/core';

/**
 * Registers a function executed during the startup of the SCION Microfrontend Platform Client.
 *
 * Initializers help to run initialization tasks (synchronous or asynchronous) during the startup of the SCION Microfrontend Platform Client.
 * The client is fully started once all initializers have completed.
 *
 * Initializers can specify a phase for execution. Initializers in lower phases execute before initializers in higher phases.
 * Initializers in the same phase may execute in parallel. If no phase is specified, the initializer executes in the `PostConnect` phase.
 *
 * Available phases, in order of execution:
 * - {@link MicrofrontendPlatformClientStartupPhase.PreConnect}
 * - {@link MicrofrontendPlatformClientStartupPhase.PostConnect}
 *
 * The function can call `inject` to get any required dependencies.
 *
 * @param initializerFn - Specifies the function to execute.
 * @param options - Controls execution of the function.
 * @return A set of dependency-injection providers to be registered in Angular.
 */
export function provideMicrofrontendPlatformClientInitializer(initializerFn: MicrofrontendPlatformClientInitializerFn, options?: MicrofrontendPlatformClientInitializerOptions): EnvironmentProviders {
  const token = MICROFRONTEND_PLATFORM_CLIENT_STARTUP_TOKENS.get(options?.phase ?? MicrofrontendPlatformClientStartupPhase.PostConnect);
  return makeEnvironmentProviders([{
    provide: token,
    useValue: initializerFn,
    multi: true,
  }]);
}

/**
 * Runs initializers associated with the given startup phase. Initializer functions can call `inject` to get required dependencies.
 */
export async function runMicrofrontendPlatformClientInitializers(phase: MicrofrontendPlatformClientStartupPhase, injector: Injector): Promise<void> {
  const token = MICROFRONTEND_PLATFORM_CLIENT_STARTUP_TOKENS.get(phase)!;
  const initializers = injector.get<MicrofrontendPlatformClientInitializerFn[]>(token, [], {optional: true});
  if (!initializers.length) {
    return;
  }

  // Run and await initializer functions in parallel.
  await Promise.all(initializers.map(initializer => runInInjectionContext(injector, initializer)));
}

/**
 * The signature of a function executed during the startup of the SCION Microfrontend Platform Client.
 *
 * Initializers help to run initialization tasks (synchronous or asynchronous) during the startup of the SCION Microfrontend Platform Client.
 * The client is fully started once all initializers have completed. The function can call `inject` to get any required dependencies.
 *
 * Initializers are registered using the `provideMicrofrontendPlatformClientInitializer()` function and can specify a phase for execution.
 *
 * ### Example:
 *
 * ```ts
 * import {bootstrapApplication} from '@angular/platform-browser';
 * import {inject} from '@angular/core';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideMicrofrontendPlatformClientInitializer(() => inject(SomeService).init()),
 *   ],
 * });
 * ```
 * @see provideMicrofrontendPlatformClientInitializer
 */
export type MicrofrontendPlatformClientInitializerFn = () => void | Promise<void>;

/**
 * Controls the execution of an initializer function during the startup of the SCION Microfrontend Platform Client.
 */
export interface MicrofrontendPlatformClientInitializerOptions {
  /**
   * Controls in which phase to execute the initializer. Defauls to {@link MicrofrontendPlatformClientStartupPhase.PostConnect}.
   */
  phase?: MicrofrontendPlatformClientStartupPhase;
}

/**
 * Enumeration of phases for running a {@link MicrofrontendPlatformClientInitializerFn} function during the startup of the SCION Microfrontend Platform Client.
 *
 * Functions associated with the same phase may run in parallel. Defaults to {@link PostConnect} phase.
 */
export enum MicrofrontendPlatformClientStartupPhase {
  /**
   * Use to run an initializer before connecting to the host.
   */
  PreConnect = 0,
  /**
   * Use to run an initializer after connected to the host.
   */
  PostConnect = 1,
}

/**
 * DI tokens called at specific times during the startup of the SCION Microfrontend Platform Client.
 */
const MICROFRONTEND_PLATFORM_CLIENT_STARTUP_TOKENS = new Map<MicrofrontendPlatformClientStartupPhase, InjectionToken<MicrofrontendPlatformClientInitializerFn>>()
  .set(MicrofrontendPlatformClientStartupPhase.PreConnect, new InjectionToken<MicrofrontendPlatformClientInitializerFn>('MICROFRONTEND_PLATFORM_CLIENT_PRE_CONNECT'))
  .set(MicrofrontendPlatformClientStartupPhase.PostConnect, new InjectionToken<MicrofrontendPlatformClientInitializerFn>('MICROFRONTEND_PLATFORM_CLIENT_POST_CONNECT'));
