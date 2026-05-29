/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, inject, signal} from '@angular/core';
import {FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {APP_IDENTITY, Capability, ManifestObjectFilter, ManifestService, ParamDefinition} from '@scion/microfrontend-platform';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Observable} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {AsyncPipe, JsonPipe} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {parseTypedValues} from '../../common/typed-value-parser.util';
import {stringifyError} from '../../common/stringify-error.util';

@Component({
  selector: 'app-register-capability',
  templateUrl: './register-capability.component.html',
  styleUrls: ['./register-capability.component.scss'],
  imports: [
    AsyncPipe,
    JsonPipe,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciKeyValueFieldComponent,
    SciCheckboxComponent,
    SciListComponent,
    SciListItemDirective,
    SciQualifierChipListComponent,
  ],
})
export default class RegisterCapabilityComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);

  public paramsPlaceholder: ParamDefinition[] = [{name: 'param1', required: true}, {name: 'param2', required: true}];
  public registerForm = this._formBuilder.group({
    type: this._formBuilder.control('', Validators.required),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    params: this._formBuilder.control(''),
    private: this._formBuilder.control(false),
    inactive: this._formBuilder.control(false),
    properties: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
  });
  public unregisterForm = this._formBuilder.group({
    id: this._formBuilder.control(''),
    type: this._formBuilder.control(''),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    nilqualifierIfEmpty: this._formBuilder.control(false),
    appSymbolicName: this._formBuilder.control(''),
  });

  public capabilities$: Observable<Capability[]>;

  public registerResponse = signal<string | undefined>(undefined);
  public registerError = signal<string | undefined>(undefined);
  public unregisterResponse = signal<'OK' | undefined>(undefined);
  public unregisterError = signal<string | undefined>(undefined);

  constructor() {
    this.capabilities$ = Beans.get(ManifestService).lookupCapabilities$({appSymbolicName: Beans.get<string>(APP_IDENTITY)});

    // If the form is cleared onRegister/onUnregister, Playwright might be too fast and see a stale response.
    this.registerForm.valueChanges.subscribe(() => {
      this.registerResponse.set(undefined);
      this.registerError.set(undefined);
    });
    this.unregisterForm.valueChanges.subscribe(() => {
      this.unregisterResponse.set(undefined);
      this.unregisterError.set(undefined);
    });
  }

  public onRegister(): void {
    const params = this.registerForm.controls.params.value;

    const capability: Capability = {
      type: this.registerForm.controls.type.value,
      qualifier: SciKeyValueFieldComponent.toDictionary(this.registerForm.controls.qualifier) ?? undefined,
      params: params ? JSON.parse(params) as ParamDefinition[] : undefined,
      private: this.registerForm.controls.private.value,
      inactive: this.registerForm.controls.inactive.value,
      properties: parseTypedValues(SciKeyValueFieldComponent.toDictionary(this.registerForm.controls.properties)) ?? undefined,
    };

    Beans.get(ManifestService).registerCapability(capability)
      .then(id => {
        this.registerResponse.set(id ?? '<null>');
      })
      .catch((error: unknown) => {
        this.registerError.set(stringifyError(error));
      })
      .finally(() => {
        this.registerForm.reset({}, {emitEvent: false});
        this.registerForm.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]), {emitEvent: false});
      });
  }

  public onUnregister(): void {
    const nilQualifierIfEmpty = this.unregisterForm.controls.nilqualifierIfEmpty.value;
    const qualifier = SciKeyValueFieldComponent.toDictionary(this.unregisterForm.controls.qualifier);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.unregisterForm.controls.id.value || undefined,
      type: this.unregisterForm.controls.type.value || undefined,
      qualifier: qualifier ?? nilQualifierOrUndefined,
      appSymbolicName: this.unregisterForm.controls.appSymbolicName.value || undefined,
    };

    Beans.get(ManifestService).unregisterCapabilities(filter)
      .then(() => {
        this.unregisterResponse.set('OK');
      })
      .catch((error: unknown) => {
        this.unregisterError.set(stringifyError(error));
      })
      .finally(() => {
        this.unregisterForm.reset({}, {emitEvent: false});
        this.unregisterForm.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]), {emitEvent: false});
      });
  }
}
