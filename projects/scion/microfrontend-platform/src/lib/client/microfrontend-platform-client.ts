/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {BeanDestroyOrders, MicrofrontendPlatform, providePlatformEnvironment} from '../microfrontend-platform';
import {ConnectOptions} from './connect-options';
import {Beans} from '@scion/toolkit/bean-manager';
import {PlatformPropertyService} from '../platform-property-service';
import {MessageClient} from './messaging/message-client';
import {IntentClient} from './messaging/intent-client';
import {OutletRouter} from './router-outlet/outlet-router';
import {RelativePathResolver} from './router-outlet/relative-path-resolver';
import {RouterOutletUrlAssigner} from './router-outlet/router-outlet-url-assigner';
import {FocusInEventDispatcher} from './focus/focus-in-event-dispatcher';
import {FocusMonitor} from './focus/focus-monitor';
import {MouseMoveEventDispatcher} from './mouse-event/mouse-move-event-dispatcher';
import {MouseUpEventDispatcher} from './mouse-event/mouse-up-event-dispatcher';
import {PreferredSizeService} from './preferred-size/preferred-size-service';
import {ContextService} from './context/context-service';
import {ManifestService} from './manifest-registry/manifest-service';
import {KeyboardEventDispatcher} from './keyboard-event/keyboard-event-dispatcher';
import {PlatformState, Runlevel} from '../platform-state';
import {OUTLET_CONTEXT, OutletContext, RouterOutlets, SciRouterOutletElement} from './router-outlet/router-outlet.element';
import {BrokerGateway, NullBrokerGateway, ɵBrokerGateway} from './messaging/broker-gateway';
import {ɵMessageClient} from './messaging/ɵmessage-client';
import {ɵIntentClient} from './messaging/ɵintent-client';

/**
 * Central point for a microfrontend to connect to the platform host in order to interact with the platform and other microfrontends.
 * This class cannot be instantiated. All functionality is provided by static methods.
 *
 * @see MicrofrontendPlatform
 * @see MicrofrontendPlatformHost
 * @see MicrofrontendPlatformClient
 *
 * @category Platform
 * @category Lifecycle
 */
export class MicrofrontendPlatformClient {

  private constructor() {
  }

  /**
   * Connects this microfrontend to the platform host.
   *
   * A microfrontend should connect to the platform host during application bootstrapping. In Angular, for example, this is typically
   * done in an app initializer. Since connecting to the platform host is an asynchronous operation, the microfrontend should wait
   * for the Promise to resolve before interacting with the platform or other microfrontends.
   *
   * The platform connects to the host through its window hierarchy. Therefore, the microfrontend must be embedded as direct or
   * indirect child window of the host application window.
   *
   * @param  symbolicName - Specifies the symbolic name of the application of this microfrontend. The application must be registered
   *         in the platform host under this symbol.
   * @param  connectOptions - Controls how to connect to the platform host.
   * @return Promise that resolves when successfully connected to the platform host, or that rejects otherwise, e.g., if not allowed
   *         to connect because not registered.
   */
  public static connect(symbolicName: string, connectOptions?: ConnectOptions): Promise<void> {
    return MicrofrontendPlatform.startPlatform(() => {
      // Provide environment for running the platform as client.
      providePlatformEnvironment({symbolicName, isPlatformHost: false});
      provideClientEnvironment({...connectOptions, connectRunlevel: Runlevel.Zero});

      // Provide initializers to start the platform as client.
      provideClientStartupInitializers();
    });
  }

  /**
   * Tests whether this microfrontend is connected to the platform host.
   */
  public static async isConnected(): Promise<boolean> {
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
   * Signals readiness to notify the platform that the microfrontend has completed initialization.
   *
   * When navigating to the microfrontend with `OutletRouter.navigate('path/to/microfrontend', {showSplash: true})`,
   * a splash is displayed until the microfrontend signals readiness.
   *
   * @see SciRouterOutletElement
   * @see NavigationOptions.showSplash
   */
  public static signalReady(): void {
    void Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT).then(outletContext => {
      if (!outletContext) {
        return Promise.reject(Error('[NullOutletContextError] not running in the context of a <sci-router-outlet>.'));
      }
      return Beans.get(MessageClient).publish(RouterOutlets.signalReadyTopic(outletContext.uid));
    });
  }
}

/**
 * Provides the environment for running the platform as client.
 *
 * @internal
 */
export function provideClientEnvironment(connectOptions: ConnectOptions & {connectRunlevel: number}): void {
  Beans.registerIfAbsent(MessageClient, {useClass: ɵMessageClient, eager: true, destroyOrder: BeanDestroyOrders.MESSAGING});
  Beans.registerIfAbsent(IntentClient, {useClass: ɵIntentClient, eager: true, destroyOrder: BeanDestroyOrders.MESSAGING});
  Beans.registerIfAbsent(OutletRouter);
  Beans.registerIfAbsent(RelativePathResolver);
  Beans.registerIfAbsent(RouterOutletUrlAssigner);
  Beans.register(FocusInEventDispatcher, {eager: true});
  Beans.register(MouseMoveEventDispatcher, {eager: true});
  Beans.register(MouseUpEventDispatcher, {eager: true});
  Beans.register(KeyboardEventDispatcher, {eager: true});
  Beans.register(PreferredSizeService, {eager: true});
  Beans.register(ContextService);
  Beans.register(ManifestService);
  Beans.register(PlatformPropertyService);
  Beans.register(FocusMonitor);
  provideBrokerGateway(connectOptions);
}

/**
 * Provide initializers to start the platform as client.
 */
function provideClientStartupInitializers(): void {
  // Block until received platform properties to support synchronous access via `PlatformPropertyService#properties`.
  Beans.registerInitializer({
    useExisting: PlatformPropertyService,
    runlevel: Runlevel.Two,
  });

  // Block until received list of applications to support synchronous access via `ManifestService#applications`.
  Beans.registerInitializer({
    useExisting: ManifestService,
    runlevel: Runlevel.Two,
  });

  // Register router outlet, delaying its instantiation until initialized the platform.
  // Otherwise, router outlet construction may fail or result in unexpected behavior, for example, because beans are not yet registered.
  Beans.registerInitializer({
    useFunction: () => SciRouterOutletElement.define(),
    runlevel: Runlevel.Two,
  });
}

/**
 * Provides the gateway to communicate with the host.
 */
function provideBrokerGateway(connectOptions: ConnectOptions & {connectRunlevel: number}): void {
  if (connectOptions.connect ?? true) {
    Beans.register(ɵBrokerGateway, {
      useFactory: () => new ɵBrokerGateway(connectOptions),
      destroyOrder: BeanDestroyOrders.MESSAGING,
    });
    Beans.register(BrokerGateway, {useExisting: ɵBrokerGateway});
    Beans.registerInitializer({useExisting: ɵBrokerGateway, runlevel: connectOptions.connectRunlevel});
  }
  else {
    Beans.register(BrokerGateway, {useClass: NullBrokerGateway});
  }
}
