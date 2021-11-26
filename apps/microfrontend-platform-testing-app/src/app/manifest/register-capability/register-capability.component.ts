/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {APP_IDENTITY, Capability, ManifestObjectFilter, ManifestService, ParamDefinition} from '@scion/microfrontend-platform';
import {SciParamsEnterComponent} from '@scion/toolkit.internal/widgets';
import {Observable} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';

const TYPE = 'type';
const QUALIFIER = 'qualifier';
const PARAMS = 'params';
const PRIVATE = 'private';
const ID = 'id';
const NILQUALIFIER_IF_EMPTY = 'nilQualifierIfEmpty';
const APP_SYMBOLIC_NAME = 'appSymbolicName';

@Component({
  selector: 'app-register-capability',
  templateUrl: './register-capability.component.html',
  styleUrls: ['./register-capability.component.scss'],
})
export class RegisterCapabilityComponent {

  public readonly TYPE = TYPE;
  public readonly QUALIFIER = QUALIFIER;
  public readonly PARAMS = PARAMS;
  public readonly PRIVATE = PRIVATE;
  public readonly ID = ID;
  public readonly NILQUALIFIER_IF_EMPTY = NILQUALIFIER_IF_EMPTY;
  public readonly APP_SYMBOLIC_NAME = APP_SYMBOLIC_NAME;

  public paramsPlaceholder: ParamDefinition[] = [{name: 'param1', required: true}, {name: 'param2', required: true}];
  public registerForm: FormGroup;
  public unregisterForm: FormGroup;

  public capabilities$: Observable<Capability[]>;

  public registerResponse: string;
  public registerError: string;
  public unregisterResponse: 'OK' | undefined;
  public unregisterError: string;

  constructor(fb: FormBuilder) {
    this.registerForm = fb.group({
      [TYPE]: new FormControl('', Validators.required),
      [QUALIFIER]: fb.array([]),
      [PARAMS]: new FormControl(''),
      [PRIVATE]: new FormControl(false),
    });

    this.unregisterForm = fb.group({
      [ID]: new FormControl(''),
      [TYPE]: new FormControl(''),
      [QUALIFIER]: fb.array([]),
      [NILQUALIFIER_IF_EMPTY]: new FormControl(false),
      [APP_SYMBOLIC_NAME]: new FormControl(''),
    });

    this.capabilities$ = Beans.get(ManifestService).lookupCapabilities$({appSymbolicName: Beans.get<string>(APP_IDENTITY)});
  }

  public onRegister(): void {
    this.registerResponse = undefined;
    this.registerError = undefined;
    const params = this.registerForm.get(PARAMS).value;

    const capability: Capability = {
      type: this.registerForm.get(TYPE).value,
      qualifier: SciParamsEnterComponent.toParamsDictionary(this.registerForm.get(QUALIFIER) as FormArray),
      params: params ? JSON.parse(params) : undefined,
      private: this.registerForm.get(PRIVATE).value,
    };

    Beans.get(ManifestService).registerCapability(capability)
      .then(id => {
        this.registerResponse = id;
      })
      .catch(error => {
        this.registerError = error;
      })
      .finally(() => {
        this.registerForm.reset();
        this.registerForm.setControl(QUALIFIER, new FormArray([]));
      });
  }

  public onUnregister(): void {
    this.unregisterResponse = undefined;
    this.unregisterError = undefined;

    const nilQualifierIfEmpty = this.unregisterForm.get(NILQUALIFIER_IF_EMPTY).value;
    const qualifier = SciParamsEnterComponent.toParamsDictionary(this.unregisterForm.get(QUALIFIER) as FormArray, false);

    const filter: ManifestObjectFilter = {
      id: this.unregisterForm.get(ID).value || undefined,
      type: this.unregisterForm.get(TYPE).value || undefined,
      qualifier: Object.keys(qualifier).length ? qualifier : (nilQualifierIfEmpty ? {} : undefined),
      appSymbolicName: this.unregisterForm.get(APP_SYMBOLIC_NAME).value || undefined,
    };

    Beans.get(ManifestService).unregisterCapabilities(filter)
      .then(() => {
        this.unregisterResponse = 'OK';
      })
      .catch(error => {
        this.unregisterError = error;
      })
      .finally(() => {
        this.unregisterForm.reset();
        this.unregisterForm.setControl(QUALIFIER, new FormArray([]));
      });
  }
}
