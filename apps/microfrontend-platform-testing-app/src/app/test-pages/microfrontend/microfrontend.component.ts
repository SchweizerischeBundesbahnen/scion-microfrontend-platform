/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {UUID} from '@scion/toolkit/uuid';
import {TestingAppService} from '../../testing-app.service';
import {ActivatedRoute, Params} from '@angular/router';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciKeyValueComponent} from '@scion/components.internal/key-value';

@Component({
  selector: 'app-microfrontend',
  templateUrl: './microfrontend.component.html',
  styleUrls: ['./microfrontend.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    SciFormFieldComponent,
    SciKeyValueComponent,
  ],
})
export default class MicrofrontendComponent {

  public appInstanceId: string;
  public componentInstanceId: string;

  public params$: Observable<Params>;
  public queryParams$: Observable<Params>;
  public fragment$: Observable<string | null>;

  constructor(testingAppService: TestingAppService, route: ActivatedRoute) {
    this.appInstanceId = testingAppService.appInstanceId;
    this.componentInstanceId = UUID.randomUUID();
    this.params$ = route.params;
    this.queryParams$ = route.queryParams;
    this.fragment$ = route.fragment;
  }
}
