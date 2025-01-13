/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EnvironmentProviders, inject, makeEnvironmentProviders, NgZone, provideAppInitializer} from '@angular/core';
import {MicrofrontendPlatformClient, ObservableDecorator} from '@scion/microfrontend-platform';
import {environment} from '../environments/environment';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgZoneObservableDecorator} from './ng-zone-observable-decorator';

/**
 * Registers a set of DI providers to set up SCION Microfrontend Platform Client.
 *
 * Has no effect if not a client.
 */
export function provideMicrofrontendPlatformClient(): EnvironmentProviders | [] {
  if (window === window.top) {
    return [];
  }

  return makeEnvironmentProviders([
    provideAppInitializer(connectToHostFn),
  ]);
}

/**
 * Connects to the SCION Microfrontend Platform Host.
 */
async function connectToHostFn(): Promise<void> {
  const zone = inject(NgZone);

  Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});
  const symbolicName = getCurrentTestingAppSymbolicName();
  return zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect(symbolicName));
}

/**
 * Identifies the currently running app based on the configured apps in the environment and the current URL.
 */
function getCurrentTestingAppSymbolicName(): string {
  const application = Object.values(environment.apps).find(app => new URL(app.url).host === window.location.host);
  if (!application) {
    throw Error(`[AppError] Application served on wrong URL. Supported URLs are: ${Object.values(environment.apps).map(app => app.url)}`);
  }
  return application.symbolicName;
}
