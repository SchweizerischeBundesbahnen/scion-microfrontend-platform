/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { Component } from '@angular/core';
import { OutletRouter } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-devtools',
  templateUrl: './devtools.component.html',
  styleUrls: ['./devtools.component.scss'],
})
export class DevToolsComponent {

  constructor() {
    Beans.get(OutletRouter).navigate(new URL(environment.devtools.manifestUrl).origin, {outlet: 'devtools'});
  }
}
