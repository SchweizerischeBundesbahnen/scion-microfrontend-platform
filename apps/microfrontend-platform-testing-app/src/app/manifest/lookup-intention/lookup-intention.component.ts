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
import {Intention, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Subscription} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';

@Component({
  selector: 'app-lookup-intention',
  templateUrl: './lookup-intention.component.html',
  styleUrls: ['./lookup-intention.component.scss'],
  imports: [
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

  protected readonly form = this._formBuilder.group({
    id: this._formBuilder.control(''),
    type: this._formBuilder.control(''),
    qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    nilqualifierIfEmpty: this._formBuilder.control(false),
    appSymbolicName: this._formBuilder.control(''),
  });
  protected readonly lookupSubscription = signal<Subscription | undefined>(undefined);
  protected readonly intentions = signal(new Array<Intention>());

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
    this.lookupSubscription.set(Beans.get(ManifestService).lookupIntentions$(filter).subscribe(intentions => this.intentions.set(intentions)));
  }

  protected onLookupCancel(): void {
    this.lookupSubscription()!.unsubscribe();
    this.intentions.set([]);
    this.lookupSubscription.set(undefined);
  }

  protected onReset(): void {
    this.form.reset();
    this.form.setControl('qualifier', this._formBuilder.array<FormGroup<KeyValueEntry>>([]));
  }
}
