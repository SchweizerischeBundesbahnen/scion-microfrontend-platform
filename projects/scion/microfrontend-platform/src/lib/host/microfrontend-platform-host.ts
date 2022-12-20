/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';
import {HostManifestInterceptor, ɵHostManifestInterceptor} from './host-manifest-interceptor';
import {BeanDestroyOrders, MicrofrontendPlatform, providePlatformEnvironment} from '../microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {ClientRegistry} from './client-registry/client.registry';
import {Logger} from '../logger';
import {PlatformPropertyService} from '../platform-property-service';
import {HttpClient} from './http-client';
import {ManifestRegistry} from './manifest-registry/manifest-registry';
import {ApplicationRegistry} from './application-registry';
import {ɵManifestRegistry} from './manifest-registry/ɵmanifest-registry';
import {FocusTracker} from './focus/focus-tracker';
import {ManifestFetcher} from './manifest-fetcher';
import {MessageBroker} from './message-broker/message-broker';
import {TopicSubscriptionRegistry} from './message-broker/topic-subscription.registry';
import {IntentSubscriptionRegistry} from './message-broker/intent-subscription.registry';
import {ManifestService} from '../client/manifest-registry/manifest-service';
import {IntentInterceptor} from './message-broker/message-interception';
import {MicrofrontendIntentNavigator} from './router/microfrontend-intent-navigator.interceptor';
import {ɵClientRegistry} from './client-registry/ɵclient.registry';
import {MessageClient} from '../client/messaging/message-client';
import {PlatformState, Runlevel} from '../platform-state';
import {CLIENT_PING_INTERVAL, CLIENT_PING_TIMEOUT} from './client-registry/client';
import {LivenessConfig} from './liveness-config';
import {AppInstaller} from './app-installer';
import {ActivatorInstaller} from './activator/activator-installer';
import {PlatformTopics} from '../ɵmessaging.model';
import {SciRouterOutletElement} from '../client/router-outlet/router-outlet.element';
import {ProgressMonitor} from './progress-monitor/progress-monitor';
import {ActivatorLoadProgressMonitor, ManifestLoadProgressMonitor, StartupProgressMonitor} from './progress-monitor/progress-monitors';
import {provideClientEnvironment} from '../client/microfrontend-platform-client';
import {defer, Observable, ReplaySubject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

/**
 * Main entry point for configuring and starting the platform in the host application. This class cannot be instantiated. All functionality is provided by static methods.
 *
 * The host application, sometimes also called the container application, provides the top-level integration container for microfrontends. Typically, it is the web
 * application which the user loads into the browser that provides the main application shell, defining areas to embed microfrontends.
 *
 * In the host application the SCION Microfrontend Platform is configured and web applications that want to interact with the platform are registered.
 * The host application can provide a manifest to contribute behavior to integrated applications. For more information, see {@link HostConfig.manifest}
 * in {@link MicrofrontendPlatformConfig.host}.
 *
 * If integrating the SCION Microfrontend Platform in a library, the manifest of the host can be augmented by registering a {@link HostManifestInterceptor}.
 *
 * @see MicrofrontendPlatform
 * @see MicrofrontendPlatformHost
 * @see MicrofrontendPlatformClient
 *
 * @category Platform
 * @category Lifecycle
 */
export class MicrofrontendPlatformHost {

  private static _startupProgress$: Observable<number>;

  private constructor() {
  }

  /**
   * Starts the platform host.
   *
   * In the host application the SCION Microfrontend Platform is configured and web applications that want to interact with the platform are registered.
   *
   * The host application can provide a manifest to declare intentions and contribute behavior to integrated applications via {@link HostConfig.manifest} in
   * {@link MicrofrontendPlatformConfig.host}. The manifest can be specified either as an object literal or as a URL to load it over the network.
   *
   * The platform should be started during the bootstrapping of the host application. In Angular, for example, the platform is typically
   * started in an app initializer. Since starting the platform host may take some time, you should wait for the startup Promise to resolve
   * before interacting with the platform.
   *
   * @param  config - Configures the platform and lists applications allowed to interact with the platform.
   * @return A Promise that resolves when started the platform host.
   */
  public static start(config: MicrofrontendPlatformConfig): Promise<void> {
    return MicrofrontendPlatform.startPlatform(() => {
        const symbolicName = config.host?.symbolicName || 'host';

        // Provide environment for running the platform as host.
        providePlatformEnvironment({symbolicName, isPlatformHost: true});
        provideClientEnvironment({
          messageDeliveryTimeout: config.host?.messageDeliveryTimeout,
          brokerDiscoverTimeout: config.host?.brokerDiscoverTimeout,
          connectRunlevel: Runlevel.One, // Connect to the broker in runlevel 1, that is, after registration of the applications.
        });
        provideHostEnvironment(config);

        // Provide initializers to start the platform as host.
        provideHostStartupInitializers(symbolicName, config);
      },
    );
  }

  /**
   * Monitors the startup progress of the platform host.
   *
   * Starting the platform host may take some time. During startup, the manifests of the registered applications are fetched,
   * activator microfrontends are installed, and the platform waits until all applications have signaled readiness.
   *
   * Subscribe to this Observable to monitor the startup progress and provide feedback to the user like displaying a
   * progress bar or a spinner. The Observable reports the progress as a percentage number. The Observable completes
   * after the platform has been started.
   */
  public static get startupProgress$(): Observable<number> {
    this._startupProgress$ = this._startupProgress$ || new Observable<number>(observer => {
      const unsubscribe$ = new ReplaySubject<void>(1);
      const progress$ = defer(() => Beans.get(StartupProgressMonitor).progress$).pipe(takeUntil(unsubscribe$));

      if (MicrofrontendPlatform.state === PlatformState.Stopped) {
        MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => progress$.subscribe(observer));
      }
      else {
        progress$.subscribe(observer);
      }
      return () => unsubscribe$.next();
    });
    return this._startupProgress$;
  }
}

/**
 * Provides the environment for running the platform as host.
 */
function provideHostEnvironment(config: MicrofrontendPlatformConfig): void {
  Beans.register(MicrofrontendPlatformConfig, {useValue: config});
  Beans.register(HostManifestInterceptor, {useClass: ɵHostManifestInterceptor, multi: true});
  Beans.register(ClientRegistry, {useClass: ɵClientRegistry, destroyOrder: BeanDestroyOrders.CORE});
  Beans.registerIfAbsent(HttpClient);
  Beans.register(ManifestRegistry, {useClass: ɵManifestRegistry, eager: true});
  Beans.register(ApplicationRegistry, {eager: true});
  Beans.register(FocusTracker, {eager: true});
  Beans.register(MessageBroker, {destroyOrder: BeanDestroyOrders.BROKER});
  Beans.register(ManifestFetcher);
  Beans.register(TopicSubscriptionRegistry, {destroyOrder: BeanDestroyOrders.BROKER});
  Beans.register(IntentSubscriptionRegistry, {destroyOrder: BeanDestroyOrders.BROKER});
  Beans.register(IntentInterceptor, {useClass: MicrofrontendIntentNavigator, multi: true});

  provideLivenessProbeConfig(config.liveness);
  provideStartupProgressMonitor();
}

/**
 * Provide initializers to start the platform as host.
 */
function provideHostStartupInitializers(symbolicName: string, config: MicrofrontendPlatformConfig): void {
  // Construct message broker immediately to not lose connect requests from clients.
  Beans.registerInitializer({
    useExisting: MessageBroker,
    runlevel: Runlevel.Zero,
  });

  // Install registered applications.
  Beans.registerInitializer({
    useFunction: () => new AppInstaller({...config.host, symbolicName}, config.applications).install(),
    runlevel: Runlevel.Zero,
  });

  // Provide platform properties to clients.
  Beans.registerInitializer({
    useFunction: () => Beans.get(MessageClient).publish(PlatformTopics.PlatformProperties, config.properties || {}, {retain: true}),
    runlevel: Runlevel.Two,
  });

  // Provide list of installed applications to clients.
  Beans.registerInitializer({
    useFunction: () => Beans.get(MessageClient).publish(PlatformTopics.Applications, Beans.get(ApplicationRegistry).getApplications(), {retain: true}),
    runlevel: Runlevel.Two,
  });

  // Register router outlet, delaying its instantiation until initialized the platform.
  // Otherwise, router outlet construction may fail or result in unexpected behavior, for example, because beans are not yet registered.
  Beans.registerInitializer({
    useFunction: () => SciRouterOutletElement.define(),
    runlevel: Runlevel.Two,
  });

  // Block until received platform properties to support synchronous access via `PlatformPropertyService#properties`.
  Beans.registerInitializer({
    useExisting: PlatformPropertyService,
    runlevel: Runlevel.Three,
  });

  // Block until received list of applications to support synchronous access via `ManifestService#applications`.
  Beans.registerInitializer({
    useExisting: ManifestService,
    runlevel: Runlevel.Three,
  });

  // Install activator microfrontends.
  Beans.registerInitializer({
    useClass: ActivatorInstaller,
    runlevel: Runlevel.Three,
  });
}

/**
 * Provides beans to monitor the startup progress of the host.
 */
function provideStartupProgressMonitor(): void {
  const monitor = new ProgressMonitor();
  const [platformProgressMonitor, manifestLoadProgressMonitor, activatorLoadProgressMonitor] = monitor.split(1, 3, 5);
  Beans.register(StartupProgressMonitor, {useValue: monitor});
  Beans.register(ManifestLoadProgressMonitor, {useValue: manifestLoadProgressMonitor});
  Beans.register(ActivatorLoadProgressMonitor, {useValue: activatorLoadProgressMonitor});
  MicrofrontendPlatform.whenState(PlatformState.Started).then(() => platformProgressMonitor.done());
}

/**
 * Provides beans describing how often to check connected clients to be alive.
 */
function provideLivenessProbeConfig(config?: LivenessConfig): void {
  const defaults = {interval: 60, timeout: 10};
  const interval = config?.interval ?? defaults.interval;
  const timeout = config?.timeout ?? defaults.timeout;

  const invalid = interval <= 2 * timeout;
  if (invalid) {
    Beans.get(Logger).warn(`[LivenessProbeConfig] Illegal config provided. The interval [${interval}s] must be greater than twice the timeout period [${timeout}s]. Using platform defaults instead: [interval=${defaults.interval}s, timeout=${defaults.timeout}s]`);
  }
  Beans.registerIfAbsent(CLIENT_PING_INTERVAL, {useValue: (invalid ? defaults.interval : interval) * 1_000});
  Beans.registerIfAbsent(CLIENT_PING_TIMEOUT, {useValue: (invalid ? defaults.timeout : timeout) * 1_000});
}
