/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {NgModule} from '@angular/core';
import {APP_IDENTITY, MessageClient, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Module which operates as activator.
 *
 * Note: This module is loaded only if loading the host app with the query parameter 'manifestClassifier=activator-routing' into the browser.
 */
@NgModule({})
export default class ActivatorRoutingModule {

  constructor() {
    const symbolicName = Beans.get<string>(APP_IDENTITY);
    console.log(`[testing] Starting activator 'ActivatorRoutingModule' of app '${symbolicName}' since started the testing app with the flag 'manifestClassifier=activator-routing'.`);

    Beans.get(MessageClient).observe$('activators/navigate-via-url')
      .subscribe(message => {
        const path = message.headers.get('path');
        const outlet = message.headers.get('outlet');
        Beans.get(OutletRouter).navigate(path, {outlet});
      });

    Beans.get(MessageClient).observe$('activators/navigate-via-intent')
      .subscribe(message => {
        const qualifier = JSON.parse(message.headers.get('qualifier'));
        const outlet = message.headers.get('outlet');
        Beans.get(OutletRouter).navigate(qualifier, {outlet});
      });
  }
}
