/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {APP_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders, NgZone} from '@angular/core';
import {IntentClient, ManifestService, MessageClient, MicrofrontendPlatformClient, ObservableDecorator, OutletRouter} from '@scion/microfrontend-platform';
import {NgZoneObservableDecorator} from './ng-zone-observable-decorator';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';

/**
 * Registers a set of DI providers to set up SCION Microfrontend Platform Client.
 */
export function provideMicrofrontendPlatformClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: connectToHostFn,
      multi: true,
    },
    {provide: MessageClient, useFactory: () => Beans.get(MessageClient)},
    {provide: IntentClient, useFactory: () => Beans.get(IntentClient)},
    {provide: OutletRouter, useFactory: () => Beans.get(OutletRouter)},
    {provide: ManifestService, useFactory: () => Beans.get(ManifestService)},
  ]);
}

/**
 * Connects devtools to the host.
 */
function connectToHostFn(): () => Promise<void> {
  const zone = inject(NgZone);
  return (): Promise<void> => {
    Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});
    return zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect(environment.symbolicName).catch(() => null));
  };
}
