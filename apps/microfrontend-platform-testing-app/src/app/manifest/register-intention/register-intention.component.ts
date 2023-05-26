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
import {ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {APP_IDENTITY, Intention, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {SciParamsEnterComponent, SciParamsEnterModule} from '@scion/components.internal/params-enter';
import {Observable} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {AsyncPipe, NgFor, NgIf} from '@angular/common';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';
import {SciListModule} from '@scion/components.internal/list';
import {SciQualifierChipListModule} from '@scion/components.internal/qualifier-chip-list';

const TYPE = 'type';
const QUALIFIER = 'qualifier';
const ID = 'id';
const NILQUALIFIER_IF_EMPTY = 'nilQualifierIfEmpty';
const APP_SYMBOLIC_NAME = 'appSymbolicName';

@Component({
  selector: 'app-register-intention',
  templateUrl: './register-intention.component.html',
  styleUrls: ['./register-intention.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    ReactiveFormsModule,
    SciFormFieldModule,
    SciParamsEnterModule,
    SciCheckboxModule,
    SciListModule,
    SciQualifierChipListModule,
  ],
})
export default class RegisterIntentionComponent {

  public readonly TYPE = TYPE;
  public readonly QUALIFIER = QUALIFIER;
  public readonly ID = ID;
  public readonly NILQUALIFIER_IF_EMPTY = NILQUALIFIER_IF_EMPTY;
  public readonly APP_SYMBOLIC_NAME = APP_SYMBOLIC_NAME;

  public registerForm: UntypedFormGroup;
  public unregisterForm: UntypedFormGroup;

  public intentions$: Observable<Intention[]>;

  public registerResponse: string;
  public registerError: string;
  public unregisterResponse: 'OK' | undefined;
  public unregisterError: string;

  constructor(fb: UntypedFormBuilder) {
    this.registerForm = fb.group({
      [TYPE]: new UntypedFormControl('', Validators.required),
      [QUALIFIER]: fb.array([]),
    });

    this.unregisterForm = fb.group({
      [ID]: new UntypedFormControl(''),
      [TYPE]: new UntypedFormControl(''),
      [QUALIFIER]: fb.array([]),
      [NILQUALIFIER_IF_EMPTY]: new UntypedFormControl(false),
      [APP_SYMBOLIC_NAME]: new UntypedFormControl(''),
    });

    this.intentions$ = Beans.get(ManifestService).lookupIntentions$({appSymbolicName: Beans.get<string>(APP_IDENTITY)});
  }

  public onRegister(): void {
    this.registerResponse = undefined;
    this.registerError = undefined;

    const intention: Intention = {
      type: this.registerForm.get(TYPE).value,
      qualifier: SciParamsEnterComponent.toParamsDictionary(this.registerForm.get(QUALIFIER) as UntypedFormArray),
    };

    Beans.get(ManifestService).registerIntention(intention)
      .then(id => {
        this.registerResponse = id;
      })
      .catch(error => {
        this.registerError = error;
      })
      .finally(() => {
        this.registerForm.reset();
        this.registerForm.setControl(QUALIFIER, new UntypedFormArray([]));
      });
  }

  public onUnregister(): void {
    this.unregisterResponse = undefined;
    this.unregisterError = undefined;

    const nilQualifierIfEmpty = this.unregisterForm.get(NILQUALIFIER_IF_EMPTY).value;
    const qualifier = SciParamsEnterComponent.toParamsDictionary(this.unregisterForm.get(QUALIFIER) as UntypedFormArray, false);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.unregisterForm.get(ID).value || undefined,
      type: this.unregisterForm.get(TYPE).value || undefined,
      qualifier: Object.keys(qualifier).length ? qualifier : nilQualifierOrUndefined,
      appSymbolicName: this.unregisterForm.get(APP_SYMBOLIC_NAME).value || undefined,
    };

    Beans.get(ManifestService).unregisterIntentions(filter)
      .then(() => {
        this.unregisterResponse = 'OK';
      })
      .catch(error => {
        this.unregisterError = error;
      })
      .finally(() => {
        this.unregisterForm.reset();
        this.unregisterForm.setControl(QUALIFIER, new UntypedFormArray([]));
      });
  }
}
