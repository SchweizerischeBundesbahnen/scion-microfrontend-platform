/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {MessageClient} from './client/messaging/message-client';
import {IntentClient} from './client/messaging/intent-client';
import {ManifestRegistry} from './host/manifest-registry/manifest-registry';
import {ApplicationRegistry} from './host/application-registry';
import {BehaviorSubject, from, Observable, Subject} from 'rxjs';
import {ConnectOptions} from './client/connect-options';
import {MicrofrontendPlatformConfig} from './host/microfrontend-platform-config';
import {PlatformPropertyService} from './platform-property-service';
import {ConsoleLogger, Logger} from './logger';
import {HttpClient} from './host/http-client';
import {ManifestCollector} from './host/manifest-collector';
import {MessageBroker} from './host/message-broker/message-broker';
import {filter, take, takeUntil} from 'rxjs/operators';
import {OutletRouter} from './client/router-outlet/outlet-router';
import {SciRouterOutletElement} from './client/router-outlet/router-outlet.element';
import {FocusInEventDispatcher} from './client/focus/focus-in-event-dispatcher';
import {FocusMonitor} from './client/focus/focus-monitor';
import {ContextService} from './client/context/context-service';
import {RouterOutletUrlAssigner} from './client/router-outlet/router-outlet-url-assigner';
import {APP_IDENTITY, IS_PLATFORM_HOST, ɵAPP_CONFIG} from './platform.model';
import {RelativePathResolver} from './client/router-outlet/relative-path-resolver';
import {ClientRegistry} from './host/message-broker/client.registry';
import {FocusTracker} from './host/focus/focus-tracker';
import {PreferredSizeService} from './client/preferred-size/preferred-size-service';
import {MouseMoveEventDispatcher} from './client/mouse-event/mouse-move-event-dispatcher';
import {MouseUpEventDispatcher} from './client/mouse-event/mouse-up-event-dispatcher';
import {KeyboardEventDispatcher} from './client/keyboard-event/keyboard-event-dispatcher';
import {ManifestService} from './client/manifest-registry/manifest-service';
import {ɵManifestRegistry} from './host/manifest-registry/ɵmanifest-registry';
import {ActivatorInstaller} from './host/activator/activator-installer';
import {BrokerGateway, NullBrokerGateway, ɵBrokerGateway} from './client/messaging/broker-gateway';
import {PlatformState, Runlevel} from './platform-state';
import {BeanInstanceConstructInstructions, Beans} from '@scion/toolkit/bean-manager';
import {ɵIntentClient} from './client/messaging/ɵintent-client';
import {ɵMessageClient} from './client/messaging/ɵmessage-client';
import {PlatformStateRef} from './platform-state-ref';
import {ProgressMonitor} from './host/progress-monitor/progress-monitor';
import {ActivatorLoadProgressMonitor, ManifestLoadProgressMonitor} from './host/progress-monitor/progress-monitors';
import {PlatformTopics} from './ɵmessaging.model';
import {createHostApplicationConfig} from './host/host-application-config-provider';
import {HostManifestInterceptor, ɵHostManifestInterceptor} from './host/host-manifest-interceptor';
import {ApplicationConfig} from './host/application-config';

window.addEventListener('beforeunload', () => MicrofrontendPlatform.destroy(), {once: true});

/**
 * **SCION Microfrontend Platform is a TypeScript-based open-source library that helps to implement a microfrontend architecture.**
 *
 * SCION Microfrontend Platform enables you to successfully implement a framework-agnostic microfrontend architecture using iframes.
 * It provides you fundamental APIs for microfrontends to communicate with each other across origin, allows embedding microfrontends
 * using a web component and enables routing between microfrontends. SCION Microfrontend Platform is a lightweight, web stack agnostic
 * library that has no user-facing components and does not dictate any form of application structure.
 *
 * You can continue using the frameworks you love since the platform integrates microfrontends via iframes. Iframes by nature provide
 * maximum isolation and allow the integration of any web application without complex adaptation. The platform aims to shield developers
 * from iframe specifics and the low-level messaging mechanism to focus instead on integrating microfrontends.
 *
 * #### Cross-microfrontend communication
 * The platform adds a pub/sub layer on top of the native `postMessage` mechanism to allow microfrontends to communicate with each other
 * easily across origins. Communication comes in two flavors: topic-based and intent-based. Both models feature the request-response message
 * exchange pattern, let you include message headers, and support message interception to implement cross-cutting messaging concerns.
 *
 * Topic-based messaging enables you to publish messages to multiple subscribers via a common topic. Publishers can mark any message they send
 * as 'to be retained', helping new subscribers get the last message published on a topic. Inspired by the Android platform, intent-based
 * communication focuses on controlled collaboration between applications, meaning that applications can provide functionality which other
 * apps can look up or invoke. For applications to interact with each other, the platform requires them to declare an intention in their
 * application manifest, which, as a nice side effect, allows the analysis of dependencies between applications.
 *
 * #### Microfrontend Integration and Routing
 * The platform makes it easy to integrate microfrontends through its router-outlet. The router-outlet is a web component that wraps an iframe.
 * It solves many of the cumbersome quirks of iframes and helps to overcome iframe restrictions. For example, it can adapt its size to the
 * preferred size of embedded content, supports keyboard event propagation, or allows you to pass contextual data to embedded content.
 * Using the router, you control which web content to display in an outlet. Multiple outlets can display different content, determined by
 * different outlet names, all at the same time. Routing works across application boundaries and enables features such as persistent navigation.
 *
 * ***
 *
 * A microfrontend architecture can be achieved in many different ways, each with its pros and cons. The SCION Microfrontend Platform uses
 * the iframe approach primarily since iframes by nature provide the highest possible level of isolation through a separate browsing context.
 * The microfrontend design approach is very tempting and has obvious advantages, especially for large-scale and long-lasting projects, most
 * notably because we are observing an enormous dynamic in web frameworks. The SCION Microfrontend Platform provides you with the necessary
 * tools to best support you in implementing such an architecture.
 *
 * @see {@link MessageClient}
 * @see {@link IntentClient}
 * @see {@link SciRouterOutletElement}
 * @see {@link OutletRouter}
 * @see {@link ContextService}
 * @see {@link PreferredSizeService}
 * @see {@link ManifestService}
 * @see {@link FocusMonitor}
 * @see {@link Activator}
 *
 * @category Platform
 */
// @dynamic `ng-packagr` does not support lambdas in statics if `strictMetaDataEmit` is enabled. `ng-packagr` is used to build this library. See https://github.com/ng-packagr/ng-packagr/issues/696#issuecomment-373487183.
export class MicrofrontendPlatform {

  private static _state$ = new BehaviorSubject<PlatformState>(PlatformState.Stopped);
  private static _startupProgress$ = new Subject<number>();

  /**
   * Starts the platform in the host application.
   *
   * The host application, sometimes also called the container application, provides the top-level integration container for microfrontends. Typically, it is the web
   * application which the user loads into his browser that provides the main application shell, defining areas to embed microfrontends.
   *
   * The platform should be started during bootstrapping of the host application. In Angular, for example, the platform is typically started in an app initializer.
   *
   * In the host, the web applications are registered as micro applications. Registered micro applications can interact with the platform and other micro applications.
   * As with micro applications, the host can provide a manifest to contribute behavior. For more information, see {@link MicrofrontendPlatformConfig.host.manifest}.
   * If you are integrating the platform in a library, you may want to add behavior to the host's manifest, which you can do with a {@link HostManifestInterceptor}.
   *
   * During platform startup, the platform loads the manifests of registered micro applications. Because starting the platform is an asynchronous operation, you should
   * wait for the startup Promise to resolve before interacting with the platform. Optionally, you can subscribe to the platform’s startup progress to provide feedback
   * to the user about the progress of the platform startup. See {@link MicrofrontendPlatform.startupProgress$} for more information.
   *
   * In the lifecycle of the platform, it traverses different lifecycle states that you can hook into by registering a callback to {@link MicrofrontendPlatform.whenState}.
   * To hook into the startup of the platform, you can register an initializer using {@link Beans.registerInitializer}, optionally passing a runlevel to control when the initializer
   * will execute. The platform supports following runlevels:
   *
   * - In runlevel `0`, the platform fetches manifests of registered micro applications.
   * - In runlevel `1`, the platform constructs eager beans.
   * - From runlevel `2` and above, messaging is enabled. This is the default runlevel at which initializers execute if not specifying any runlevel.
   * - In runlevel `3`, the platform installs activator microfrontends. See https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:activator to learn more about activators.
   *
   * @param  config - Configures the platform and defines the micro applications running in the platform.
   * @return A Promise that resolves once platform startup completed.
   */
  public static startHost(config: MicrofrontendPlatformConfig): Promise<void> {
    return MicrofrontendPlatform.startPlatform(async () => {
        await SciRouterOutletElement.define();
        MicrofrontendPlatform.installHostStartupProgressMonitor();

        registerRunlevel0Initializers();
        registerRunlevel1Initializers();
        registerRunlevel2Initializers();
        registerRunlevel3Initializers();

        Beans.register(APP_IDENTITY, {useValue: config.host?.symbolicName || 'host'});
        Beans.register(MicrofrontendPlatformConfig, {useValue: config});
        Beans.register(IS_PLATFORM_HOST, {useValue: true});
        Beans.register(HostManifestInterceptor, {useClass: ɵHostManifestInterceptor, multi: true});
        Beans.register(ClientRegistry);
        Beans.registerIfAbsent(Logger, {useClass: ConsoleLogger});
        Beans.register(PlatformPropertyService, {eager: true});
        Beans.registerIfAbsent(HttpClient);
        Beans.register(ManifestRegistry, {useClass: ɵManifestRegistry, eager: true});
        Beans.register(ApplicationRegistry, {eager: true});
        Beans.register(ContextService);
        Beans.register(FocusTracker, {eager: true});
        Beans.register(FocusInEventDispatcher, {eager: true});
        Beans.register(MouseMoveEventDispatcher, {eager: true});
        Beans.register(MouseUpEventDispatcher, {eager: true});
        Beans.register(MessageBroker, {destroyOrder: Number.MAX_VALUE});
        Beans.registerIfAbsent(OutletRouter);
        Beans.registerIfAbsent(RelativePathResolver);
        Beans.registerIfAbsent(RouterOutletUrlAssigner);
        Beans.register(PlatformStateRef, {useValue: MicrofrontendPlatform});
        Beans.registerIfAbsent(MessageClient, provideMessageClient());
        Beans.registerIfAbsent(IntentClient, provideIntentClient());
        Beans.register(FocusMonitor);
        Beans.register(PreferredSizeService);
        Beans.register(ManifestService);
        Beans.register(KeyboardEventDispatcher, {eager: true});
        Beans.register(BrokerGateway, provideBrokerGateway({
          connectToHost: true,
          messageDeliveryTimeout: config.host?.messageDeliveryTimeout,
        }));

        // Register app configs under the symbol `ɵAPP_CONFIG` in the bean manager.
        new Array<ApplicationConfig>()
          .concat(createHostApplicationConfig(config.host))
          .concat(config.applications)
          .filter(application => !application.exclude)
          .forEach(application => Beans.register(ɵAPP_CONFIG, {useValue: application, multi: true}));
      },
    );

    /**
     * Registers initializers to run in runlevel 0.
     */
    function registerRunlevel0Initializers(): void {
      // Construct the message broker to buffer connect requests of micro applications.
      Beans.registerInitializer({useFunction: async () => void (Beans.get(MessageBroker)), runlevel: Runlevel.Zero});
      // Fetch manifests.
      Beans.registerInitializer({useClass: ManifestCollector, runlevel: Runlevel.Zero});
    }

    /**
     * Registers initializers to run in runlevel 1.
     */
    function registerRunlevel1Initializers(): void {
      // Wait until connected to the message broker, or reject if the maximal broker discovery timeout has elapsed.
      Beans.registerInitializer({
        useFunction: () => Beans.get(BrokerGateway).whenConnected(),
        runlevel: Runlevel.One,
      });
    }

    /**
     * Registers initializers to run in runlevel 2.
     */
    function registerRunlevel2Initializers(): void {
      // After messaging is enabled, publish platform properties as retained message.
      Beans.registerInitializer({
        useFunction: () => Beans.get(MessageClient).publish(PlatformTopics.PlatformProperties, config.properties || {}, {retain: true}),
        runlevel: Runlevel.Two,
      });
      // After messaging is enabled, publish registered applications as retained message.
      Beans.registerInitializer({
        useFunction: () => Beans.get(MessageClient).publish(PlatformTopics.Applications, Beans.get(ApplicationRegistry).getApplications(), {retain: true}),
        runlevel: Runlevel.Two,
      });
      // Wait until obtained platform properties so that they can be accessed synchronously by the application via `PlatformPropertyService#properties`.
      Beans.registerInitializer({
        useFunction: () => Beans.get(PlatformPropertyService).whenPropertiesLoaded,
        runlevel: Runlevel.Two,
      });
      // Wait until obtained registered applications so that they can be accessed synchronously by the application via `ManifestService#applications`.
      Beans.registerInitializer({
        useFunction: () => Beans.get(ManifestService).whenApplicationsLoaded,
        runlevel: Runlevel.Two,
      });
    }

    /**
     * Registers initializers to run in runlevel 3.
     */
    function registerRunlevel3Initializers(): void {
      // Install activator microfrontends.
      Beans.registerInitializer({useClass: ActivatorInstaller, runlevel: Runlevel.Three});
    }
  }

  /**
   * Connects a micro application to the platform host.
   *
   * The platform host checks whether the connecting micro application is qualified to connect, i.e., is registered in the host application under that origin;
   * otherwise, the host will reject the connection attempt. Note that the micro application needs to be embedded as a direct or indirect child window of the
   * host application window.
   *
   * After the connection with the platform host is established, the micro application can interact with the host and other micro applications. Typically, the
   * micro application connects to the platform host during bootstrapping. In Angular, for example, this can be done in an app initializer.
   *
   * In the lifecycle of the platform, it traverses different lifecycle states that you can hook into by registering a callback to {@link MicrofrontendPlatform.whenState}.
   *
   * @param  symbolicName - Specifies the symbolic name of this micro application. The micro application must be registered in the platform host under this symbol.
   * @param  connectOptions - Controls how to connect to the platform host.
   * @return A Promise that resolves once connected to the platform host, or that rejects otherwise.
   */
  public static connectToHost(symbolicName: string, connectOptions?: ConnectOptions): Promise<void> {
    return MicrofrontendPlatform.startPlatform(async () => {
        await SciRouterOutletElement.define();
        this.installClientStartupProgressMonitor();

        registerRunlevel1Initializers();
        registerRunlevel2Initializers();

        Beans.register(IS_PLATFORM_HOST, {useValue: false});
        Beans.register(APP_IDENTITY, {useValue: symbolicName});
        Beans.register(PlatformPropertyService, {eager: true});
        Beans.registerIfAbsent(Logger, {useClass: ConsoleLogger});
        Beans.registerIfAbsent(HttpClient);
        Beans.register(BrokerGateway, provideBrokerGateway({
          connectToHost: connectOptions?.connect ?? true,
          messageDeliveryTimeout: connectOptions?.messageDeliveryTimeout,
          brokerDiscoveryTimeout: connectOptions?.brokerDiscoverTimeout,
        }));
        Beans.registerIfAbsent(MessageClient, provideMessageClient());
        Beans.registerIfAbsent(IntentClient, provideIntentClient());
        Beans.registerIfAbsent(OutletRouter);
        Beans.registerIfAbsent(RelativePathResolver);
        Beans.registerIfAbsent(RouterOutletUrlAssigner);
        Beans.register(FocusInEventDispatcher, {eager: true});
        Beans.register(FocusMonitor);
        Beans.register(MouseMoveEventDispatcher, {eager: true});
        Beans.register(MouseUpEventDispatcher, {eager: true});
        Beans.register(PreferredSizeService);
        Beans.register(ContextService);
        Beans.register(ManifestService);
        Beans.register(KeyboardEventDispatcher, {eager: true});
        Beans.register(PlatformStateRef, {useValue: MicrofrontendPlatform});
      },
    );

    /**
     * Registers initializers to run in runlevel 1.
     */
    function registerRunlevel1Initializers(): void {
      // Wait until connected to the message broker, or reject if the maximal broker discovery timeout has elapsed.
      Beans.registerInitializer({
        useFunction: () => Beans.get(BrokerGateway).whenConnected(),
        runlevel: Runlevel.One,
      });
    }

    /**
     * Registers initializers to run in runlevel 2.
     */
    function registerRunlevel2Initializers(): void {
      // Wait until obtained platform properties so that they can be accessed synchronously by the application via `PlatformPropertyService#properties`.
      Beans.registerInitializer({
        useFunction: () => Beans.get(PlatformPropertyService).whenPropertiesLoaded,
        runlevel: Runlevel.Two,
      });

      // Wait until obtained registered applications so that they can be accessed synchronously by the application via `ManifestService#applications`.
      Beans.registerInitializer({
        useFunction: () => Beans.get(ManifestService).whenApplicationsLoaded,
        runlevel: Runlevel.Two,
      });
    }
  }

  /**
   * Checks whether this micro application is connected to the platform host.
   */
  public static async isConnectedToHost(): Promise<boolean> {
    if (MicrofrontendPlatform.state === PlatformState.Stopped) {
      return false;
    }
    const brokerGateway = Beans.opt(BrokerGateway);
    if (!brokerGateway) {
      return false;
    }
    return brokerGateway.isConnected();
  }

  /**
   * Destroys this platform and releases resources allocated.
   *
   * @return a Promise that resolves once the platformed stopped.
   */
  public static async destroy(): Promise<void> {
    await MicrofrontendPlatform.enterState(PlatformState.Stopping);
    Beans.destroy();
    await MicrofrontendPlatform.enterState(PlatformState.Stopped);
  }

  /** @internal */
  public static async startPlatform(startupFn?: () => Promise<void>): Promise<void> {
    await MicrofrontendPlatform.enterState(PlatformState.Starting);
    try {
      await startupFn?.();
      await Beans.start({eagerBeanConstructRunlevel: Runlevel.One, initializerDefaultRunlevel: Runlevel.Two});
      await MicrofrontendPlatform.enterState(PlatformState.Started);
      return Promise.resolve();
    }
    catch (error) {
      Beans.destroy();
      return Promise.reject(`[MicrofrontendPlatformStartupError] Microfrontend platform failed to start: ${error}`);
    }
  }

  /**
   * @return the current platform state.
   */
  public static get state(): PlatformState {
    return this._state$.getValue();
  }

  /**
   * Allows to wait for the platform to enter the specified {@link PlatformState}.
   * If already in that state, the Promise resolves instantly.
   *
   * @param  state - the state to wait for.
   * @return A Promise that resolves when the platform enters the given state.
   *         If already in that state, the Promise resolves instantly.
   */
  public static async whenState(state: PlatformState): Promise<void> {
    return this._state$
      .pipe(filter(it => it === state), take(1))
      .toPromise()
      .then(() => Promise.resolve());
  }

  /**
   * Observable that, when subscribed, emits the current platform lifecycle state.
   * It never completes and emits continuously when the platform enters
   * another state.
   */
  public static get state$(): Observable<PlatformState> {
    return this._state$;
  }

  private static async enterState(newState: PlatformState): Promise<void> {
    const currentState = (this.state === PlatformState.Stopped) ? -1 : this.state;
    if (currentState >= newState) {
      throw Error(`[PlatformStateError] Failed to enter platform state [prevState=${PlatformState[this.state]}, newState=${PlatformState[newState]}].`);
    }

    this._state$.next(newState);

    // Let microtasks waiting for entering that state to resolve first.
    await this.whenState(newState);
  }

  /**
   * Allows listening to the startup progress of the platform.
   *
   * In the host, when the platform starts, it fetches the manifests of the registered applications, among other things,
   * and waits for the applications to signal their readiness, which can take some time.
   *
   * You can subscribe to this Observable to provide feedback to the user about the progress of the platform startup.
   * The Observable reports the progress as a percentage number. The Observable completes once the platform finished startup.
   */
  public static get startupProgress$(): Observable<number> {
    return this._startupProgress$;
  }

  private static installHostStartupProgressMonitor(): void {
    const monitor = new ProgressMonitor();

    const [startupProgressMonitor, manifestLoadProgressMonitor, activatorLoadProgressMonitor] = monitor.split(1, 3, 5);
    Beans.register(ManifestLoadProgressMonitor, {useValue: manifestLoadProgressMonitor});
    Beans.register(ActivatorLoadProgressMonitor, {useValue: activatorLoadProgressMonitor});
    MicrofrontendPlatform.whenState(PlatformState.Started).then(() => {
      startupProgressMonitor.done();
    });
    MicrofrontendPlatform.whenState(PlatformState.Stopped).then(() => {
      MicrofrontendPlatform._startupProgress$ = new Subject<number>();
    });

    monitor.progress$
      .pipe(takeUntil(from(MicrofrontendPlatform.whenState(PlatformState.Started))))
      .subscribe(MicrofrontendPlatform._startupProgress$);
  }

  private static installClientStartupProgressMonitor(): void {
    const monitor = new ProgressMonitor();
    MicrofrontendPlatform.whenState(PlatformState.Started).then(() => {
      monitor.done();
    });
    MicrofrontendPlatform.whenState(PlatformState.Stopped).then(() => {
      MicrofrontendPlatform._startupProgress$ = new Subject<number>();
    });

    monitor.progress$
      .pipe(takeUntil(from(MicrofrontendPlatform.whenState(PlatformState.Started))))
      .subscribe(MicrofrontendPlatform._startupProgress$);
  }
}

/** @ignore */
function provideBrokerGateway(config: {connectToHost: boolean; messageDeliveryTimeout?: number; brokerDiscoveryTimeout?: number}): BeanInstanceConstructInstructions {
  if (!config.connectToHost) {
    return {useClass: NullBrokerGateway};
  }
  return {
    useFactory: () => new ɵBrokerGateway({
      brokerDiscoveryTimeout: config.brokerDiscoveryTimeout ?? 10000,
      messageDeliveryTimeout: config.messageDeliveryTimeout ?? 10000,
    }),
    eager: true,
    destroyOrder: Number.MAX_VALUE,
  };
}

/** @ignore */
function provideMessageClient(): BeanInstanceConstructInstructions {
  return {
    useClass: ɵMessageClient,
    eager: true,
    destroyOrder: Number.MAX_VALUE,
  };
}

/** @ignore */
function provideIntentClient(): BeanInstanceConstructInstructions {
  return {
    useClass: ɵIntentClient,
    eager: true,
    destroyOrder: Number.MAX_VALUE,
  };
}
