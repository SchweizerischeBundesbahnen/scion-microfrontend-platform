/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {SciThrobberComponent} from '@scion/components/throbber';

@Component({
  selector: 'app-devtools',
  templateUrl: './devtools.component.html',
  styleUrls: ['./devtools.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // required because <sci-router-outlet> is a custom element
  imports: [
    SciThrobberComponent,
  ],
})
export class DevToolsComponent {

  constructor() {
    Beans.get(OutletRouter).navigate({component: 'devtools', vendor: 'scion'}, {outlet: 'devtools'});
  }
}
