/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { MessageClient } from './client/messaging/message-client';
import { ManifestRegistry } from './host/manifest-registry/manifest-registry';
import { ApplicationRegistry } from './host/application-registry';
import { BeanInstanceConstructInstructions, Beans, InstanceConstructInstructions, Type } from './bean-manager';
import { ɵMessageClient } from './client/messaging/ɵmessage-client';
import { PlatformState, PlatformStates } from './platform-state';
import { PlatformConfigLoader } from './host/platform-config-loader';
import { from } from 'rxjs';
import { MicroApplicationConfig } from './client/micro-application-config';
import { ApplicationConfig, PlatformConfig } from './host/platform-config';
import { PlatformPropertyService } from './platform-property-service';
import { ConsoleLogger, Logger } from './logger';
import { HttpClient } from './host/http-client';
import { ManifestCollector } from './host/manifest-collector';
import { PlatformMessageClient } from './host/platform-message-client';
import { PLATFORM_SYMBOLIC_NAME } from './host/platform.constants';
import { Defined } from '@scion/toolkit/util';
import { HostPlatformState } from './client/host-platform-state';
import { MessageBroker } from './host/message-broker/message-broker';
import { PlatformTopics } from './ɵmessaging.model';
import { takeUntil } from 'rxjs/operators';
import { OutletRouter } from './client/router-outlet/outlet-router';
import { SciRouterOutletElement } from './client/router-outlet/router-outlet.element';
import { FocusInEventDispatcher } from './client/focus/focus-in-event-dispatcher';
import { FocusMonitor } from './client/focus/focus-monitor';
import { ContextService } from './client/context/context-service';
import { RouterOutletUrlAssigner } from './client/router-outlet/router-outlet-url-assigner';
import { IS_PLATFORM_HOST } from './platform.model';
import { RelativePathResolver } from './client/router-outlet/relative-path-resolver';
import { ClientRegistry } from './host/message-broker/client.registry';
import { FocusTracker } from './host/focus/focus-tracker';
import { PreferredSizeService } from './client/preferred-size/preferred-size-service';
import { MouseMoveEventDispatcher } from './client/mouse-event/mouse-move-event-dispatcher';
import { MouseUpEventDispatcher } from './client/mouse-event/mouse-up-event-dispatcher';
import { HostPlatformAppProvider } from './host/host-platform-app-provider';
import { KeyboardEventDispatcher } from './client/keyboard-event/keyboard-event-dispatcher';
import { ManifestService } from './client/manifest-registry/manifest-service';
import { ɵManifestRegistry } from './host/manifest-registry/ɵmanifest-registry';
import { ApplicationActivator } from './host/activator/application-activator';
import { PlatformManifestService } from './client/manifest-registry/platform-manifest-service';

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
 * @see {@link SciRouterOutletElement}
 * @see {@link OutletRouter}
 * @see {@link ContextService}
 * @see {@link PreferredSizeService}
 * @see {@link ManifestService}
 * @see {@link FocusMonitor}
 * @see {@link Intention}
 * @see {@link Capability}
 * @see {@link Activator}
 * @see {@link Beans}
 *
 * @category Platform
 */
// @dynamic `ng-packagr` does not support lamdas in statics if `strictMetaDataEmit` is enabled. `ng-packagr` is used to build this library. See https://github.com/ng-packagr/ng-packagr/issues/696#issuecomment-373487183.
export class MicrofrontendPlatform {

  /**
   * Starts the platform in the host application.
   *
   * The host application, sometimes also called the container application, provides the top-level integration container for microfrontends. Typically, it is the web
   * app which the user loads into his browser and provides the main application shell, defining areas to embed microfrontends.
   *
   * The platform host loads the manifests of all registered micro applications and starts platform services such as the message broker for client-side messaging.
   * Typically, the platform is started during bootstrapping the application. In Angular, for example, the platform should be started in an app initializer.
   *
   * You can pass the configuration statically, or load it asynchronously using a config loader, e.g., for loading the config over the network.
   *
   * Note: If the host app wants to interact with either the platform or the micro applications, the host app also has to register itself as a micro application. The host app has
   * no extra privileges compared to other micro applications.
   *
   * @param  platformConfig - Platform config declaring the micro applications allowed to interact with the platform. You can pass the configuration statically, or load it
   *                          asynchronously using a config loader, e.g., for loading the config over the network.
   * @param  hostAppConfig - Config of the micro application running in the host application; only required if interacting with the platform in the host application.
   * @return A Promise that resolves when the platform started successfully, or that rejects if the startup fails.
   */
  public static startHost(platformConfig: ApplicationConfig[] | PlatformConfig | Type<PlatformConfigLoader>, hostAppConfig?: MicroApplicationConfig): Promise<void> {
    return MicrofrontendPlatform.startPlatform(() => {
        Beans.registerInitializer({useClass: ManifestCollector});

        Beans.register(IS_PLATFORM_HOST, {useValue: true});
        Beans.register(HostPlatformAppProvider);
        Beans.register(ClientRegistry);
        Beans.registerIfAbsent(Logger, {useClass: ConsoleLogger});
        Beans.register(PlatformPropertyService, {eager: true});
        Beans.registerIfAbsent(HttpClient);
        Beans.register(PlatformConfigLoader, createConfigLoaderBeanDescriptor(platformConfig));
        Beans.register(ManifestRegistry, {useClass: ɵManifestRegistry, eager: true, destroyPhase: PlatformStates.Stopped});
        Beans.register(ApplicationRegistry, {eager: true, destroyPhase: PlatformStates.Stopped});
        Beans.registerIfAbsent(PlatformMessageClient, provideMessageClient(PLATFORM_SYMBOLIC_NAME, hostAppConfig && hostAppConfig.messaging));
        Beans.register(HostPlatformState);
        Beans.register(ContextService);
        Beans.register(FocusTracker, {eager: true});
        Beans.register(FocusInEventDispatcher, {eager: true});
        Beans.register(MouseMoveEventDispatcher, {eager: true});
        Beans.register(MouseUpEventDispatcher, {eager: true});
        Beans.register(ApplicationActivator, {eager: true});
        Beans.register(PlatformManifestService);

        // Construct the bean manager instantly to receive connect requests of micro applications.
        Beans.registerIfAbsent(MessageBroker, {useValue: new MessageBroker(), destroyPhase: PlatformStates.Stopped});

        if (hostAppConfig) {
          Beans.registerInitializer(() => SciRouterOutletElement.define());
          Beans.register(MicroApplicationConfig, {useValue: hostAppConfig});
          Beans.registerIfAbsent(MessageClient, provideMessageClient(hostAppConfig.symbolicName, hostAppConfig.messaging));
          Beans.registerIfAbsent(OutletRouter);
          Beans.registerIfAbsent(RelativePathResolver);
          Beans.registerIfAbsent(RouterOutletUrlAssigner);
          Beans.register(FocusMonitor);
          Beans.register(PreferredSizeService);
          Beans.register(ManifestService);
          Beans.register(KeyboardEventDispatcher, {eager: true});
        }
        else {
          Beans.registerIfAbsent(MessageClient, {useExisting: PlatformMessageClient});
        }

        // Notify micro application instances about host platform state changes.
        Beans.get(PlatformState).state$
          .pipe(takeUntil(from(Beans.get(PlatformState).whenState(PlatformStates.Stopping))))
          .subscribe(state => {
            Beans.get(PlatformMessageClient).publish(PlatformTopics.HostPlatformState, state, {retain: true});
          });
      },
    ).then(() => Beans.get(HostPlatformState).whenStarted()); // Wait until the host platform reported its 'started' state before signalling the platform as started.
  }

  /**
   * Allows a micro application to connect to the platform host.
   *
   * The platform host checks whether the connecting micro application is a registered micro application. It also checks its origin,
   * i.e., that it matches the manifest origin of the registered micro application. This check prevents micro applications from
   * connecting to the platform on behalf of other micro applications.
   *
   * When connected to the platform, the micro application can interact with the platform and other micro applications. Typically, the
   * micro application connects to the platform host during bootstrapping, that is, before displaying content to the user.In Angular, for
   * example, this should be done in an app initializer.
   *
   * Note: To establish the connection, the micro application needs to be registered in the host application and embedded as a direct or indirect
   * child window of the host application window.
   *
   * @param  config - Identity of the micro application to connect.
   * @return A Promise that resolves when the platform started successfully, or that rejects if the startup fails.
   */
  public static connectToHost(config: MicroApplicationConfig): Promise<void> {
    return MicrofrontendPlatform.startPlatform(() => {
        Beans.registerInitializer(() => SciRouterOutletElement.define());
        // Obtain platform properties before signalling the platform as started to allow synchronous retrieval of platform properties.
        Beans.registerInitializer(async () => {
          if (await MicrofrontendPlatform.isConnectedToHost()) {
            await Beans.get(PlatformPropertyService).whenPropertiesLoaded;
          }
        });

        Beans.register(IS_PLATFORM_HOST, {useValue: false});
        Beans.register(MicroApplicationConfig, {useValue: config});
        Beans.register(PlatformPropertyService, {eager: true});
        Beans.registerIfAbsent(Logger, {useClass: ConsoleLogger});
        Beans.registerIfAbsent(HttpClient);
        Beans.registerIfAbsent(MessageClient, provideMessageClient(config.symbolicName, config.messaging));
        Beans.register(HostPlatformState);
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
      },
    );
  }

  /**
   * Checks if this micro application is connected to the platform host.
   */
  public static async isConnectedToHost(): Promise<boolean> {
    if (Beans.get(PlatformState).state === PlatformStates.Stopped) {
      return false;
    }
    return Beans.get(MessageClient).isConnected();
  }

  /**
   * Destroys this platform and releases resources allocated.
   *
   * @return a Promise that resolves once the platformed stopped.
   */
  public static async destroy(): Promise<void> {
    await Beans.get(PlatformState).enterState(PlatformStates.Stopping);
    Beans.destroy();
    await Beans.get(PlatformState).enterState(PlatformStates.Stopped);
  }

  /** @internal */
  public static async startPlatform(startupFn: () => void): Promise<void> {
    await Beans.get(PlatformState).enterState(PlatformStates.Starting);
    try {
      startupFn();

      return Beans.runInitializers()
        .then(() => Beans.get(PlatformState).enterState(PlatformStates.Started))
        .catch(async error => {
          await Beans.destroy();
          return Promise.reject(`[PlatformStartupError] Microfrontend platform failed to start: ${error}`);
        });
    }
    catch (error) {
      await Beans.destroy();
      return Promise.reject(`[PlatformStartupError] Microfrontend platform failed to start: ${error}`);
    }
  }
}

/**
 * Creates a {@link PlatformConfigLoader} from the given config.
 * @ignore
 */
function createConfigLoaderBeanDescriptor(config: ApplicationConfig[] | PlatformConfig | Type<PlatformConfigLoader>): InstanceConstructInstructions {
  if (typeof config === 'function') {
    return {useClass: config}; // {PlatformConfigLoader} class
  }
  else if (Array.isArray(config)) { // array of {ApplicationConfig} objects
    return {useValue: new StaticPlatformConfigLoader({apps: config, properties: {}})};
  }
  else { // {PlatformConfig} object
    return {useValue: new StaticPlatformConfigLoader(config)};
  }
}

/** @ignore */
function provideMessageClient(clientAppName: string, config?: { brokerDiscoverTimeout?: number, deliveryTimeout?: number }): BeanInstanceConstructInstructions {
  return {
    useFactory: (): MessageClient => {
      const discoveryTimeout = Defined.orElse(config && config.brokerDiscoverTimeout, 10000);
      const deliveryTimeout = Defined.orElse(config && config.deliveryTimeout, 10000);
      return new ɵMessageClient(clientAppName, {discoveryTimeout, deliveryTimeout});
    },
    eager: true,
    destroyPhase: PlatformStates.Stopped,
  };
}

/** @ignore */
class StaticPlatformConfigLoader implements PlatformConfigLoader {

  constructor(private _config: PlatformConfig) {
  }

  public load(): Promise<PlatformConfig> {
    return Promise.resolve(this._config);
  }
}
