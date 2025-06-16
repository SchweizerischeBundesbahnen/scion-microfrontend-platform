/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {EnvironmentProviders, inject, Injector, makeEnvironmentProviders, NgZone, provideAppInitializer} from '@angular/core';
import {ContextService, IntentClient, ManifestService, MessageClient, MicrofrontendPlatformClient, ObservableDecorator, OutletRouter} from '@scion/microfrontend-platform';
import {NgZoneObservableDecorator} from './ng-zone-observable-decorator';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';
import {MicrofrontendPlatformClientStartupPhase, runMicrofrontendPlatformClientInitializers} from './microfrontend-platform-client-initializer';

/**
 * Registers a set of DI providers to set up SCION Microfrontend Platform Client.
 */
export function provideMicrofrontendPlatformClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(connectToHostFn),
    {provide: MessageClient, useFactory: () => Beans.get(MessageClient)},
    {provide: IntentClient, useFactory: () => Beans.get(IntentClient)},
    {provide: OutletRouter, useFactory: () => Beans.get(OutletRouter)},
    {provide: ManifestService, useFactory: () => Beans.get(ManifestService)},
    {provide: ContextService, useFactory: () => Beans.get(ContextService)},
  ]);
}

/**
 * Connects devtools to the host.
 */
async function connectToHostFn(): Promise<void> {
  const zone = inject(NgZone);
  const injector = inject(Injector);

  Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});
  await runMicrofrontendPlatformClientInitializers(MicrofrontendPlatformClientStartupPhase.PreConnect, injector);
  if (await zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect(environment.symbolicName).then(() => true).catch(() => false))) {
    await runMicrofrontendPlatformClientInitializers(MicrofrontendPlatformClientStartupPhase.PostConnect, injector);
  }
}
