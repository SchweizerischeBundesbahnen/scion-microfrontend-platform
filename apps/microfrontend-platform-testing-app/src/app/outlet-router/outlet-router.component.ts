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
import {UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {NavigationOptions, OutletRouter} from '@scion/microfrontend-platform';
import {SciParamsEnterComponent} from '@scion/components.internal/params-enter';
import {Beans} from '@scion/toolkit/bean-manager';

export const OUTLET = 'outlet';
export const USE_INTENT = 'useIntent';
export const URL = 'url';
export const QUALIFIER = 'qualifier';
export const PARAMS = 'params';
export const PUSH_SESSION_HISTORY_STATE = 'pushSessionHistoryState';

@Component({
  selector: 'app-outlet-router',
  templateUrl: './outlet-router.component.html',
  styleUrls: ['./outlet-router.component.scss'],
})
export class OutletRouterComponent {

  public OUTLET = OUTLET;
  public USE_INTENT = USE_INTENT;
  public URL = URL;
  public QUALIFIER = QUALIFIER;
  public PARAMS = PARAMS;
  public PUSH_SESSION_HISTORY_STATE = PUSH_SESSION_HISTORY_STATE;

  public form: UntypedFormGroup;
  public navigateError: string;
  public navigated = false;

  constructor(formBuilder: UntypedFormBuilder) {
    this.form = formBuilder.group({
      [OUTLET]: new UntypedFormControl(''),
      [USE_INTENT]: new UntypedFormControl(false),
      [URL]: new UntypedFormControl(''),
      [QUALIFIER]: formBuilder.array([]),
      [PARAMS]: formBuilder.array([]),
      [PUSH_SESSION_HISTORY_STATE]: new UntypedFormControl(false),
    });
  }

  public async onNavigateClick(): Promise<void> {
    const options: NavigationOptions = {
      outlet: this.form.get(OUTLET).value || undefined,
      params: SciParamsEnterComponent.toParamsMap(this.form.get(PARAMS) as UntypedFormArray),
    };
    if (this.form.get(PUSH_SESSION_HISTORY_STATE).value) {
      options.pushStateToSessionHistoryStack = true;
    }

    this.navigateError = undefined;
    this.navigated = false;
    try {
      if (this.form.get(USE_INTENT).value) {
        const qualifier = SciParamsEnterComponent.toParamsDictionary(this.form.get(QUALIFIER) as UntypedFormArray);
        await Beans.get(OutletRouter).navigate(qualifier, options);
      }
      else {
        const url = this.form.get(URL).value || null;
        await Beans.get(OutletRouter).navigate(url, options);
      }

      this.navigated = true;
      this.form.reset();
      this.form.setControl(PARAMS, new UntypedFormArray([]));
      this.form.setControl(QUALIFIER, new UntypedFormArray([]));
    }
    catch (error) {
      this.navigateError = error;
    }
  }
}
