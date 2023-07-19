/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {coerceNumberProperty} from '@angular/cdk/coercion';
import {UUID} from '@scion/toolkit/uuid';
import {BrowserOutletComponent} from '../browser-outlet/browser-outlet.component';
import {AsyncPipe, NgFor} from '@angular/common';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';

@Component({
  selector: 'app-browser-outlets',
  templateUrl: './browser-outlets.component.html',
  styleUrls: ['./browser-outlets.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    SciSashboxComponent,
    SciSashDirective,
    BrowserOutletComponent,
  ],
})
export default class BrowserOutletsComponent {

  public outletNames$: Observable<string[]>;

  constructor(route: ActivatedRoute) {
    this.outletNames$ = route.paramMap.pipe(map(params => {
      if (params.has('names')) {
        return params.get('names')!.split(',');
      }
      else if (params.has('count')) {
        const count = coerceNumberProperty(params.get('count'));
        return new Array(count).fill(undefined).map(() => UUID.randomUUID());
      }
      else {
        return [UUID.randomUUID()];
      }
    }));
  }
}
