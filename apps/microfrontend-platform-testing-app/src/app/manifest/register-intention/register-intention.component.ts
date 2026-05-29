/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {APP_IDENTITY, Intention, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Beans} from '@scion/toolkit/bean-manager';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {stringifyError} from '../../common/stringify-error.util';
import {toSignal} from '@angular/core/rxjs-interop';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'app-register-intention',
  templateUrl: './register-intention.component.html',
  styleUrls: ['./register-intention.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciKeyValueFieldComponent,
    SciCheckboxComponent,
    SciListComponent,
    SciListItemDirective,
    SciQualifierChipListComponent,
    SciMaterialIconDirective,
  ],
})
export default class RegisterIntentionComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);

  protected readonly registerForm = this._formBuilder.group({
    type: this._formBuilder.control('', Validators.required),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
  });

  protected readonly unregisterForm = this._formBuilder.group({
    id: this._formBuilder.control(''),
    type: this._formBuilder.control(''),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    nilqualifierIfEmpty: this._formBuilder.control(false),
    appSymbolicName: this._formBuilder.control(''),
  });

  protected readonly intentions = toSignal(Beans.get(ManifestService).lookupIntentions$({appSymbolicName: Beans.get<string>(APP_IDENTITY)}));
  protected readonly registerResponse = signal<string | undefined>(undefined);
  protected readonly registerError = signal<string | undefined>(undefined);
  protected readonly unregisterResponse = signal<'OK' | undefined>(undefined);
  protected readonly unregisterError = signal<string | undefined>(undefined);

  protected onRegister(): void {
    const intention: Intention = {
      type: this.registerForm.controls.type.value,
      qualifier: SciKeyValueFieldComponent.toDictionary(this.registerForm.controls.qualifier, false),
    };

    Beans.get(ManifestService).registerIntention(intention)
      .then(id => {
        this.registerResponse.set(id);
      })
      .catch((error: unknown) => {
        this.registerError.set(stringifyError(error));
      })
      .finally(() => {
        this.registerForm.reset();
        this.registerForm.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]));
      });
  }

  protected onClearRegisterResponse(): void {
    this.registerResponse.set(undefined);
    this.registerError.set(undefined);
  }

  protected onUnregister(): void {
    const nilQualifierIfEmpty = this.unregisterForm.controls.nilqualifierIfEmpty.value;
    const qualifier = SciKeyValueFieldComponent.toDictionary(this.unregisterForm.controls.qualifier);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.unregisterForm.controls.id.value || undefined,
      type: this.unregisterForm.controls.type.value || undefined,
      qualifier: qualifier ?? nilQualifierOrUndefined,
      appSymbolicName: this.unregisterForm.controls.appSymbolicName.value || undefined,
    };

    Beans.get(ManifestService).unregisterIntentions(filter)
      .then(() => {
        this.unregisterResponse.set('OK');
      })
      .catch((error: unknown) => {
        this.unregisterError.set(stringifyError(error));
      })
      .finally(() => {
        this.unregisterForm.reset();
        this.unregisterForm.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]));
      });
  }

  protected onClearUnregisterResponse(): void {
    this.unregisterResponse.set(undefined);
    this.unregisterError.set(undefined);
  }
}
