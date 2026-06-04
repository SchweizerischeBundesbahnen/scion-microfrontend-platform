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
import {FormGroup, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Capability, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Beans} from '@scion/toolkit/bean-manager';
import {Clipboard} from '@angular/cdk/clipboard';
import {JsonPipe} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-lookup-capability',
  templateUrl: './lookup-capability.component.html',
  styleUrls: ['./lookup-capability.component.scss'],
  imports: [
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

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _clipboard = inject(Clipboard);

  protected readonly form = this._formBuilder.group({
    id: this._formBuilder.control(''),
    type: this._formBuilder.control(''),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    nilqualifierIfEmpty: this._formBuilder.control(false),
    appSymbolicName: this._formBuilder.control(''),
  });

  protected readonly lookupSubscription = signal<Subscription | undefined>(undefined);
  protected readonly capabilities = signal(new Array<Capability>());

  protected onLookup(): void {
    const nilQualifierIfEmpty = this.form.controls.nilqualifierIfEmpty.value;
    const qualifier = SciKeyValueFieldComponent.toDictionary(this.form.controls.qualifier);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.form.controls.id.value || undefined,
      type: this.form.controls.type.value || undefined,
      qualifier: qualifier ?? nilQualifierOrUndefined,
      appSymbolicName: this.form.controls.appSymbolicName.value || undefined,
    };

    this.lookupSubscription.set(Beans.get(ManifestService).lookupCapabilities$(filter).subscribe(capabilities => this.capabilities.set(capabilities)));
  }

  protected onLookupCancel(): void {
    this.lookupSubscription()!.unsubscribe();
    this.capabilities.set([]);
    this.lookupSubscription.set(undefined);
  }

  protected onCopyToClipboard(capability: Capability): void {
    this._clipboard.copy(JSON.stringify(capability, null, 2));
  }

  protected onReset(): void {
    this.form.reset();
    this.form.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]));
  }
}
