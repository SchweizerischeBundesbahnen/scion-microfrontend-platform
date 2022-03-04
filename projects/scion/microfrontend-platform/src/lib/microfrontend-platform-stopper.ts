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

/**
 * Stops the platform and disconnect this client from the host when the document is being unloaded.
 *
 * For this purpose, this class binds to the browser's `unload` event. It does not bind to the `beforeunload`
 * event since the browser fires that event only when navigating to another page, but not when removing the iframe.
 */
export abstract class MicrofrontendPlatformStopper {
}

/**
 * @internal
 */
export class ɵMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper, PreDestroy {

  private onUnload = (): void => Beans.get(MicrofrontendPlatformRef).destroy();

  constructor() { // eslint-disable-line @typescript-eslint/member-ordering
    window.addEventListener('unload', this.onUnload, {once: true});
  }

  public preDestroy(): void {
    window.removeEventListener('unload', this.onUnload);
  }
}
