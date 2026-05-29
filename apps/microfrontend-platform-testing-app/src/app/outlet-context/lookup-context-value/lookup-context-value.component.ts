/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, DestroyRef, inject, signal} from '@angular/core';
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
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _contextService = Beans.get(ContextService);

  protected readonly form = this._formBuilder.group({
    key: this._formBuilder.control('', Validators.required),
    collect: this._formBuilder.control(false, Validators.required),
  });

  protected readonly observeValue = signal<unknown>(undefined);
  protected readonly lookupValue = signal<unknown>(undefined);
  protected readonly subscribeError = signal<string | undefined>(undefined);

  private _subscription: Subscription | undefined;

  protected onSubscribe(): void {
    const key = this.form.controls.key.value;
    const options = {collect: this.form.controls.collect.value};
    this.form.controls.key.disable();
    this.form.controls.collect.disable();

    // Observe
    this._subscription = this._contextService.observe$(key, options)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: next => this.observeValue.set(next),
        error: (error: unknown) => this.subscribeError.set(stringifyError(error)),
      });

    // Lookup
    this._contextService.lookup(key, options)
      .then(value => this.lookupValue.set(value))
      .catch((error: unknown) => this.subscribeError.set(stringifyError(error)));
  }

  protected onUnsubscribe(): void {
    this._subscription!.unsubscribe();
    this.form.controls.key.enable();
    this.form.controls.collect.enable();

    this.lookupValue.set(undefined);
    this.observeValue.set(undefined);
    this.subscribeError.set(undefined);
  }

  protected get isSubscribed(): boolean {
    return !!this._subscription && !this._subscription.closed;
  }
}
