/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatformRef} from './microfrontend-platform-ref';
import {fromEvent, race, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

/**
 * Stops the platform and disconnects this client from the host when the browser unloads the document.
 *
 * By default, the platform initiates shutdown when the browser unloads the document, i.e., when `beforeunload` is triggered.
 * The main reason for `beforeunload` instead of `unload` is to avoid posting messages to disposed windows.
 * However, if `beforeunload` is not triggered, e.g., when an iframe is removed, we fall back to `unload`.
 */
export abstract class MicrofrontendPlatformStopper {
}

/**
 * @internal
 */
export class ɵMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper, PreDestroy {

  private _destroy$ = new Subject<void>();

  constructor() {
    race(fromEvent(window, 'beforeunload'), fromEvent(window, 'unload'))
      .pipe(
        take(1),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        Beans.get(MicrofrontendPlatformRef).destroy();
      });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}
