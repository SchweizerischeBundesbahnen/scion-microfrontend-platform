/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatform} from './microfrontend-platform';

/**
 * Stops the platform and disconnects this client from the host when the browser unloads the document.
 *
 * By default, the platform initiates shutdown when the `pagehide` event is triggered and the page is entering the terminated state.
 *
 * @category Platform
 */
export abstract class MicrofrontendPlatformStopper {
}

/**
 * @internal
 */
export class ɵMicrofrontendPlatformStopper implements MicrofrontendPlatformStopper {

  constructor() {
    window.addEventListener('pagehide', event => {
      // Destroy microfrontend platform only if the page is entering the `terminated` state.
      // https://developer.chrome.com/docs/web-platform/page-lifecycle-api#event-pagehide
      // https://developer.chrome.com/docs/web-platform/page-lifecycle-api/image/page-lifecycle-api-state.svg
      if (!event.persisted) {
        MicrofrontendPlatform.destroy();
      }
    });
  }
}
