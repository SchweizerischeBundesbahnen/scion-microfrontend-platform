/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Beans} from '@scion/toolkit/bean-manager';
import {ContextService} from '@scion/microfrontend-platform';
import {Subscription} from 'rxjs';
import {JsonPipe} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {stringifyError} from '../../common/stringify-error.util';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-context-value-lookup',
  templateUrl: './lookup-context-value.component.html',
  styleUrls: ['./lookup-context-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciCheckboxComponent,
    SciSashboxComponent,
    SciSashDirective,
  ],
})
export default class LookupContextValueComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _contextService = Beans.get(ContextService);

  protected readonly form = this._formBuilder.group({
    key: this._formBuilder.control('', Validators.required),
    collect: this._formBuilder.control(false, Validators.required),
  });

  private _subscription: Subscription | undefined;

  protected observeValue: unknown;
  protected lookupValue: unknown;
  protected subscribeError: string | undefined;

  protected onSubscribe(): void {
    const key = this.form.controls.key.value;
    const options = {collect: this.form.controls.collect.value};
    this.form.controls.key.disable();
    this.form.controls.collect.disable();

    // Observe
    this._subscription = this._contextService.observe$(key, options)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: next => {
          this.observeValue = next;
          this._cd.markForCheck();
        },
        error: (error: unknown) => {
          this.subscribeError = stringifyError(error);
          this._cd.markForCheck();
        },
      });

    // Lookup
    this._contextService.lookup(key, options)
      .then(value => this.lookupValue = value)
      .catch((error: unknown) => this.subscribeError = stringifyError(error))
      .finally(() => this._cd.markForCheck());
  }

  protected onUnsubscribe(): void {
    this._subscription!.unsubscribe();
    this.form.controls.key.enable();
    this.form.controls.collect.enable();

    this.lookupValue = undefined;
    this.observeValue = undefined;
    this.subscribeError = undefined;
  }

  protected get isSubscribed(): boolean {
    return !!this._subscription && !this._subscription.closed;
  }
}
