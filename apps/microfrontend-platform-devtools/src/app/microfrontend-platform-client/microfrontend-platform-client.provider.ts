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
import {ContextService, IntentClient, ManifestService, MessageClient, MicrofrontendPlatformClient, ObservableDecorator, OutletRouter} from '@scion/microfrontend-platform';
import {NgZoneObservableDecorator} from './ng-zone-observable-decorator';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';
import {noop} from 'rxjs';
import {DOCUMENT} from '@angular/common';

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
  const documentRoot = inject<Document>(DOCUMENT).documentElement;

  return async (): Promise<void> => {
    Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});
    await zone.runOutsideAngular(() => MicrofrontendPlatformClient.connect(environment.symbolicName).catch(noop));
    await applyTheme(documentRoot);
  };
}

/**
 * Looks up the color scheme of the embedding context and applies either the 'scion-dark' or 'scion-light' theme.
 */
async function applyTheme(documentRoot: HTMLElement): Promise<void> {
  const colorScheme = await Beans.opt(ContextService)?.lookup<'light' | 'dark' | null>('color-scheme');
  if (colorScheme) {
    documentRoot.setAttribute('sci-theme', colorScheme === 'dark' ? 'scion-dark' : 'scion-light');
  }
}

