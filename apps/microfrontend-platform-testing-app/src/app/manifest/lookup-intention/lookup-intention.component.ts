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
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Intention, ManifestObjectFilter, ManifestService} from '@scion/microfrontend-platform';
import {SciParamsEnterComponent} from '@scion/toolkit.internal/widgets';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';

const ID = 'id';
const TYPE = 'type';
const QUALIFIER = 'qualifier';
const NILQUALIFIER_IF_EMPTY = 'nilQualifierIfEmpty';
const APP_SYMBOLIC_NAME = 'appSymbolicName';

@Component({
  selector: 'app-lookup-intention',
  templateUrl: './lookup-intention.component.html',
  styleUrls: ['./lookup-intention.component.scss'],
})
export class LookupIntentionComponent {

  public readonly ID = ID;
  public readonly TYPE = TYPE;
  public readonly QUALIFIER = QUALIFIER;
  public readonly NILQUALIFIER_IF_EMPTY = NILQUALIFIER_IF_EMPTY;
  public readonly APP_SYMBOLIC_NAME = APP_SYMBOLIC_NAME;

  public form: FormGroup;
  public intentions$: Observable<Intention[]>;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      [ID]: new FormControl(''),
      [TYPE]: new FormControl(''),
      [QUALIFIER]: fb.array([]),
      [NILQUALIFIER_IF_EMPTY]: new FormControl(false),
      [APP_SYMBOLIC_NAME]: new FormControl(''),
    });
  }

  public onLookup(): void {
    const nilQualifierIfEmpty = this.form.get(NILQUALIFIER_IF_EMPTY).value;
    const qualifier = SciParamsEnterComponent.toParamsDictionary(this.form.get(QUALIFIER) as FormArray, false);
    const nilQualifierOrUndefined = nilQualifierIfEmpty ? {} : undefined;

    const filter: ManifestObjectFilter = {
      id: this.form.get(ID).value || undefined,
      type: this.form.get(TYPE).value || undefined,
      qualifier: Object.keys(qualifier).length ? qualifier : nilQualifierOrUndefined,
      appSymbolicName: this.form.get(APP_SYMBOLIC_NAME).value || undefined,
    };
    this.intentions$ = Beans.get(ManifestService).lookupIntentions$(filter)
      .pipe(finalize(() => this.intentions$ = null));
  }

  public onLookupCancel(): void {
    this.intentions$ = null;
  }

  public onReset(): void {
    this.form.reset();
    this.form.setControl(QUALIFIER, new FormArray([]));
  }
}
