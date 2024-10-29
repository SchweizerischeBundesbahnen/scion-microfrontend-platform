/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {BehaviorSubject, Observable} from 'rxjs';
import {first} from 'rxjs/operators';
import {PlatformState, Runlevel} from './platform-state';
import {Beans} from '@scion/toolkit/bean-manager';
import {APP_IDENTITY, IS_PLATFORM_HOST} from './platform.model';
import {ɵVERSION, ɵWINDOW_TOP} from './ɵplatform.model';
import {MicrofrontendPlatformStopper, ɵMicrofrontendPlatformStopper} from './microfrontend-platform-stopper';
import {ConsoleLogger, Logger} from './logger';

/**
 * Current version of the SCION Microfrontend Platform.
 */
const version = '1.3.1';

/**
 * The central class of the SCION Microfrontend Platform. This class cannot be instantiated. All functionality is provided by static methods.
 *
 * To enable tree-shaking of the SCION Microfrontend Platform, the platform provides three separate entry points:
 * - {@link MicrofrontendPlatformHost} to configure and start the platform in the host
 * - {@link MicrofrontendPlatformClient} to connect to the platform from a microfrontend
 * - {@link MicrofrontendPlatform} to react to platform lifecycle events and stop the platform
 *
 * ## SCION Microfrontend Platform
 *
 * SCION Microfrontend Platform is a TypeScript-based open source library that enables the implementation of a framework-agnostic
 * microfrontend architecture using iframes. It provides fundamental APIs for microfrontends to communicate with each other across origins
 * and facilitates embedding microfrontends using a web component and a router. SCION Microfrontend Platform is a lightweight, web stack
 * agnostic library that has no user-facing components and does not dictate any form of application structure.
 *
 * You can continue using the frameworks you love since the platform integrates microfrontends via iframes. Iframes by nature provide
 * maximum isolation and allow the integration of any web application without complex adaptation. The platform aims to shield developers
 * from iframe specifics and the low-level messaging mechanism to focus instead on integrating microfrontends.
 *
 * #### Cross-microfrontend communication
 * The platform adds a pub/sub layer on top of the native `postMessage` mechanism to enable microfrontends to communicate with each other
 * easily across origins. Communication comes in two flavors: topic-based and intent-based. Both models feature request-response message
 * exchange, support retained messages for late subscribers to receive the latest messages, and provide API to intercept messages to
 * implement cross-cutting messaging concerns.
 *
 * Topic-based messaging enables you to publish messages to multiple subscribers via a common topic. Intent-based communication focuses on
 * controlled collaboration between applications. To collaborate, an application must express an intention. Manifesting intentions enables
 * us to see dependencies between applications down to the functional level.
 *
 * #### Microfrontend Integration and Routing
 * The platform makes it easy to integrate microfrontends through its router-outlet. The router-outlet is a web component that wraps an iframe.
 * It solves many of the cumbersome quirks of iframes and helps to overcome iframe restrictions. For example, it can adapt its size to the
 * preferred size of embedded content, supports keyboard event propagation and lets you pass contextual data to embedded content.
 * Using the router, you control which web content to display in an outlet. Multiple outlets can display different content, determined by
 * different outlet names, all at the same time. Routing works across application boundaries and enables features such as persistent navigation.
 *
 * ***
 *
 * A microfrontend architecture can be achieved in many ways, each with its pros and cons. The SCION Microfrontend Platform uses
 * the iframe approach primarily since iframes by nature provide the highest possible level of isolation through a separate browsing context.
 * The microfrontend design approach is very tempting and has obvious advantages, especially for large-scale and long-lasting projects, most
 * notably because we are observing an enormous dynamic in web frameworks. The SCION Microfrontend Platform provides you with the necessary
 * tools to best support you in implementing such an architecture.
 *
 * @see {@link MicrofrontendPlatformHost}
 * @see {@link MicrofrontendPlatformClient}
 *
 * @see {@link MessageClient}
 * @see {@link IntentClient}
 * @see {@link SciRouterOutletElement}
 * @see {@link OutletRouter}
 * @see {@link ContextService}
 * @see {@link PreferredSizeService}
 * @see {@link ManifestService}
 * @see {@link FocusMonitor}
 * @see {@link ActivatorCapability}
 *
 * @category Platform
 * @category Lifecycle
 */
export class MicrofrontendPlatform {

  private static readonly _state$ = new BehaviorSubject<PlatformState>(PlatformState.Stopped);

  private constructor() {
  }

  /**
   * @internal
   */
  public static async startPlatform(startupFn?: () => void): Promise<void> {
    if (this.state === PlatformState.Started) {
      return Promise.reject(Error('[MicrofrontendPlatformStartupError] Platform already started'));
    }

    try {
      startupFn?.();
      await this.enterState(PlatformState.Starting);
      await Beans.start({eagerBeanConstructRunlevel: Runlevel.One, initializerDefaultRunlevel: Runlevel.Two});
      await this.enterState(PlatformState.Started);
      return Promise.resolve();
    }
    catch (error) {
      await this.destroy();
      return Promise.reject(Error(`[MicrofrontendPlatformStartupError] Microfrontend platform failed to start: ${error}`));
    }
  }

  /**
   * Destroys this platform and releases resources allocated.
   *
   * @return a Promise that resolves once the platformed stopped.
   */
  public static async destroy(): Promise<void> {
    await this.enterState(PlatformState.Stopping);
    Beans.destroy();
    await this.enterState(PlatformState.Stopped);
  }

  /**
   * @return the current platform state.
   */
  public static get state(): PlatformState {
    return this._state$.getValue();
  }

  /**
   * Observable that, when subscribed, emits the current platform lifecycle state.
   * It never completes and emits continuously when the platform enters
   * another state.
   */
  public static get state$(): Observable<PlatformState> {
    return this._state$;
  }

  /**
   * Waits for the platform to enter the specified {@link PlatformState}.
   * If already in that state, the Promise resolves instantly.
   *
   * @param  state - the state to wait for.
   * @return A Promise that resolves when the platform enters the given state.
   *         If already in that state, the Promise resolves instantly.
   */
  public static async whenState(state: PlatformState): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._state$
        .pipe(first(it => it === state))
        .subscribe({
          error: reject,
          complete: resolve,
        });
    });
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
}

/**
 * @internal
 */
export function providePlatformEnvironment(config: {symbolicName: string; isPlatformHost: boolean}): void {
  Beans.register(IS_PLATFORM_HOST, {useValue: config.isPlatformHost});
  Beans.register(APP_IDENTITY, {useValue: config.symbolicName});
  Beans.registerIfAbsent(ɵWINDOW_TOP, {useValue: window.top});
  Beans.registerIfAbsent(ɵVERSION, {useValue: version, destroyOrder: BeanDestroyOrders.CORE});
  Beans.registerIfAbsent(MicrofrontendPlatformStopper, {useClass: ɵMicrofrontendPlatformStopper, eager: true});
  Beans.registerIfAbsent(Logger, {useClass: ConsoleLogger, destroyOrder: BeanDestroyOrders.CORE});
}

/**
 * Specifies destroy orders of platform-specific beans, enabling controlled termination of the platform.
 *
 * @internal
 */
export enum BeanDestroyOrders {
  /**
   * Use for core platform beans which should be destroyed as the very last beans.
   */
  CORE = Number.MAX_SAFE_INTEGER,
  /**
   * Use for the {@link MessageBroker}.
   */
  BROKER = CORE - 1,
  /**
   * Use for messaging-related beans.
   */
  MESSAGING = BROKER - 1
}
