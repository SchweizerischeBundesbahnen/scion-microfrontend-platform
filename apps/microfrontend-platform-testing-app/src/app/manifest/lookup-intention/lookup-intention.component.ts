/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, inject} from '@angular/core';
import {FormGroup, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Intention, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {AsyncPipe} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';

@Component({
  selector: 'app-lookup-intention',
  templateUrl: './lookup-intention.component.html',
  styleUrls: ['./lookup-intention.component.scss'],
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciKeyValueFieldComponent,
    SciCheckboxComponent,
    SciListComponent,
    SciListItemDirective,
    SciQualifierChipListComponent,
  ],
})
export default class LookupIntentionComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);

  public form = this._formBuilder.group({
    id: this._formBuilder.control(''),
    type: this._formBuilder.control(''),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    nilqualifierIfEmpty: this._formBuilder.control(false),
    appSymbolicName: this._formBuilder.control(''),
  });
  public intentions$: Observable<Intention[]> | undefined;

  public onLookup(): void {
    const nilQualifierIfEmpty = this.form.controls.nilqualifierIfEmpty.value;
    const qualifier = SciKeyValueFieldComponent.toDictionary(this.form.controls.qualifier);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.form.controls.id.value || undefined,
      type: this.form.controls.type.value || undefined,
      qualifier: qualifier ?? nilQualifierOrUndefined,
      appSymbolicName: this.form.controls.appSymbolicName.value || undefined,
    };
    this.intentions$ = Beans.get(ManifestService).lookupIntentions$(filter)
      .pipe(finalize(() => this.intentions$ = undefined));
  }

  public onLookupCancel(): void {
    this.intentions$ = undefined;
  }

  public onReset(): void {
    this.form.reset();
    this.form.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]));
  }
}
