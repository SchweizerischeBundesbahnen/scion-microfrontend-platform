/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {MicrofrontendPlatformHost} from '../../host/microfrontend-platform-host';
import {Beans} from '@scion/toolkit/bean-manager';
import {OutletRouter} from './outlet-router';
import {SciRouterOutletElement} from './router-outlet.element';
import {fromEvent, lastValueFrom} from 'rxjs';
import {take} from 'rxjs/operators';

describe('OutletRouter', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should support navigating to blob URL', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    // Add <sci-router-outlet> element to the DOM.
    const sciRouterOutlet = document.body.appendChild(document.createElement('sci-router-outlet') as SciRouterOutletElement);
    sciRouterOutlet.name = 'outlet';
    sciRouterOutlet.style.height = '150px';
    sciRouterOutlet.style.width = '300px';
    sciRouterOutlet.style.border = '1px solid black';

    // Create blob URL.
    const content = '<html><body><main>Blob Content</main></body></html>';
    const blobUrl = URL.createObjectURL(new Blob([content], {type: 'text/html'}));

    // Navigate to blob URL.
    void Beans.get(OutletRouter).navigate(blobUrl, {outlet: 'outlet'});

    // Wait until loaded the blob page into the iframe.
    // Since the iframe is initialized with the "about:blank" page, we expect the blob page load event to fire as the second load event.
    await lastValueFrom(fromEvent(sciRouterOutlet.iframe, 'load').pipe(take(2)));

    // Expect the blob page to display.
    expect((sciRouterOutlet.iframe.contentWindow!.document.querySelector('main'))!.innerText).toEqual('Blob Content');

    // Cleanup resources.
    URL.revokeObjectURL(blobUrl);
  });

  describe('intent-based-routing', () => {
    it('should reject navigation if passing "relativeTo" navigation option', async () => {
      await MicrofrontendPlatformHost.start({applications: []});
      const navigate = Beans.get(OutletRouter).navigate({entity: 'person'}, {relativeTo: 'url'});
      await expectAsync(navigate).toBeRejectedWithError(/\[OutletRouterError]\[UnsupportedOptionError]/);
    });

    it('should validate microfrontend params', async () => {
      await MicrofrontendPlatformHost.start({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'microfrontend',
                qualifier: {entity: 'person'},
                params: [{name: 'id', required: true}],
                properties: {
                  path: 'microfrontend',
                },
              },
            ],
          },
        },
        applications: [],
      });

      const navigate = Beans.get(OutletRouter).navigate({entity: 'person'});
      await expectAsync(navigate).toBeRejectedWithError(/IntentParamValidationError/);
    });
  });
});
