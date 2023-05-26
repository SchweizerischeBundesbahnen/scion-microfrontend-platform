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
import {ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {Capability, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {SciParamsEnterComponent, SciParamsEnterModule} from '@scion/components.internal/params-enter';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {Clipboard} from '@angular/cdk/clipboard';
import {AsyncPipe, JsonPipe, NgFor, NgIf} from '@angular/common';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';
import {SciListModule} from '@scion/components.internal/list';
import {SciQualifierChipListModule} from '@scion/components.internal/qualifier-chip-list';

const ID = 'id';
const TYPE = 'type';
const QUALIFIER = 'qualifier';
const NILQUALIFIER_IF_EMPTY = 'nilQualifierIfEmpty';
const APP_SYMBOLIC_NAME = 'appSymbolicName';

@Component({
  selector: 'app-lookup-capability',
  templateUrl: './lookup-capability.component.html',
  styleUrls: ['./lookup-capability.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    JsonPipe,
    ReactiveFormsModule,
    SciFormFieldModule,
    SciParamsEnterModule,
    SciCheckboxModule,
    SciListModule,
    SciQualifierChipListModule,
  ],
})
export default class LookupCapabilityComponent {

  public readonly ID = ID;
  public readonly TYPE = TYPE;
  public readonly QUALIFIER = QUALIFIER;
  public readonly NILQUALIFIER_IF_EMPTY = NILQUALIFIER_IF_EMPTY;
  public readonly APP_SYMBOLIC_NAME = APP_SYMBOLIC_NAME;

  public form: UntypedFormGroup;
  public capabilities$: Observable<Capability[]>;

  constructor(fb: UntypedFormBuilder, private _clipboard: Clipboard) {
    this.form = fb.group({
      [ID]: new UntypedFormControl(''),
      [TYPE]: new UntypedFormControl(''),
      [QUALIFIER]: fb.array([]),
      [NILQUALIFIER_IF_EMPTY]: new UntypedFormControl(false),
      [APP_SYMBOLIC_NAME]: new UntypedFormControl(''),
    });
  }

  public onLookup(): void {
    const nilQualifierIfEmpty = this.form.get(NILQUALIFIER_IF_EMPTY).value;
    const qualifier = SciParamsEnterComponent.toParamsDictionary(this.form.get(QUALIFIER) as UntypedFormArray, false);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.form.get(ID).value || undefined,
      type: this.form.get(TYPE).value || undefined,
      qualifier: Object.keys(qualifier).length ? qualifier : nilQualifierOrUndefined,
      appSymbolicName: this.form.get(APP_SYMBOLIC_NAME).value || undefined,
    };
    this.capabilities$ = Beans.get(ManifestService).lookupCapabilities$(filter)
      .pipe(finalize(() => this.capabilities$ = null));
  }

  public onLookupCancel(): void {
    this.capabilities$ = null;
  }

  public onCopyToClipboard(capability: Capability): void {
    this._clipboard.copy(JSON.stringify(capability, null, 2));
  }

  public onReset(): void {
    this.form.reset();
    this.form.setControl(QUALIFIER, new UntypedFormArray([]));
  }
}
