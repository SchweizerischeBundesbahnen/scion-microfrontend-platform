/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {Beans} from '@scion/toolkit/bean-manager';
import {ContextService, MessageClient, MicrofrontendPlatformClient, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {from, switchMap} from 'rxjs';

/**
 * Signals readiness when a message is published to the topic `signal-ready/outletName`.
 */
@Component({
  selector: 'app-signal-ready-test-page',
  template: '',
  standalone: true,
})
export default class SignalReadyTestPageComponent {

  constructor() {
    from(Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT))
      .pipe(
        switchMap(outletContext => Beans.get(MessageClient).observe$(`signal-ready/${outletContext!.name}`)),
        takeUntilDestroyed(),
      )
      .subscribe(() => MicrofrontendPlatformClient.signalReady());
  }
}
