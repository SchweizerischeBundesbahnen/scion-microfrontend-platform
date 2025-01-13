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
import {FormGroup, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Capability, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {Clipboard} from '@angular/cdk/clipboard';
import {AsyncPipe, JsonPipe} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'app-lookup-capability',
  templateUrl: './lookup-capability.component.html',
  styleUrls: ['./lookup-capability.component.scss'],
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
    SciMaterialIconDirective,
  ],
})
export default class LookupCapabilityComponent {

  public form = this._formBuilder.group({
    id: this._formBuilder.control(''),
    type: this._formBuilder.control(''),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    nilqualifierIfEmpty: this._formBuilder.control(false),
    appSymbolicName: this._formBuilder.control(''),
  });
  public capabilities$: Observable<Capability[]> | undefined;

  constructor(private _formBuilder: NonNullableFormBuilder, private _clipboard: Clipboard) {
  }

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
    this.capabilities$ = Beans.get(ManifestService).lookupCapabilities$(filter)
      .pipe(finalize(() => this.capabilities$ = undefined));
  }

  public onLookupCancel(): void {
    this.capabilities$ = undefined;
  }

  public onCopyToClipboard(capability: Capability): void {
    this._clipboard.copy(JSON.stringify(capability, null, 2));
  }

  public onReset(): void {
    this.form.reset();
    this.form.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]));
  }
}
