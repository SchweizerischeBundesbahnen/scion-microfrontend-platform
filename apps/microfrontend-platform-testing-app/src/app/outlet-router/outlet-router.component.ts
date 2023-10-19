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
import {FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {NavigationOptions, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgIf} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {distinctUntilChanged, startWith} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AppAsPipe} from '../common/as.pipe';
import {stringifyError} from '../common/stringify-error.util';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';

@Component({
  selector: 'app-outlet-router',
  templateUrl: './outlet-router.component.html',
  styleUrls: ['./outlet-router.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciCheckboxComponent,
    SciKeyValueFieldComponent,
    AppAsPipe,
  ],
})
export default class OutletRouterComponent {

  public form = this._formBuilder.group({
    outlet: this._formBuilder.control(''),
    useIntent: this._formBuilder.control(false),
    destination: this._formBuilder.group<UrlDestination | IntentDestination>(this.createUrlDestination()),
    params: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    pushSessionHistoryState: this._formBuilder.control(false),
    showSplash: this._formBuilder.control(false),
  });

  public navigateError: string | undefined;

  public UrlDestinationFormGroup = FormGroup<UrlDestination>;
  public IntentDestinationFormGroup = FormGroup<IntentDestination>;

  constructor(private _formBuilder: NonNullableFormBuilder) {
    this.form.controls.useIntent.valueChanges
      .pipe(
        startWith(this.form.controls.useIntent.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(useIntent => {
        const destination = useIntent ? this.createIntentDestination() : this.createUrlDestination();
        this.form.setControl('destination', this._formBuilder.group(destination));
      });
  }

  public async onNavigateClick(): Promise<void> {
    const options: NavigationOptions = {
      outlet: this.form.controls.outlet.value || undefined,
      params: SciKeyValueFieldComponent.toMap(this.form.controls.params) ?? undefined,
      showSplash: this.form.controls.showSplash.value,
    };
    if (this.form.controls.pushSessionHistoryState.value) {
      options.pushStateToSessionHistoryStack = true;
    }

    this.navigateError = undefined;
    try {
      if (this.form.controls.useIntent.value) {
        const qualifier = SciKeyValueFieldComponent.toDictionary((this.form.controls.destination as FormGroup<IntentDestination>).controls.qualifier)!;
        await Beans.get(OutletRouter).navigate(qualifier, options);
        this.form.setControl('destination', this._formBuilder.group<UrlDestination | IntentDestination>(this.createIntentDestination()));
      }
      else {
        const url = (this.form.controls.destination as FormGroup<UrlDestination>).controls.url.value || null;
        await Beans.get(OutletRouter).navigate(url, options);
      }

      this.form.reset();
    }
    catch (error: unknown) {
      this.navigateError = stringifyError(error);
    }
  }

  private createUrlDestination(): UrlDestination {
    return {
      url: this._formBuilder.control(''), // not required to allow clearing the outlet
    };
  }

  private createIntentDestination(): IntentDestination {
    return {
      qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([], Validators.required),
    };
  }
}

interface UrlDestination {
  url: FormControl<string>;
}

interface IntentDestination {
  qualifier: FormArray<FormGroup<KeyValueEntry>>;
}
