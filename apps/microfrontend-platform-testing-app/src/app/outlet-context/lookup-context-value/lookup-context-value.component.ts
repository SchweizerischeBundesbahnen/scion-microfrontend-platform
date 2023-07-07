/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Beans} from '@scion/toolkit/bean-manager';
import {ContextService} from '@scion/microfrontend-platform';
import {Subscription} from 'rxjs';
import {JsonPipe, NgIf} from '@angular/common';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';
import {SciSashboxModule} from '@scion/components/sashbox';

@Component({
  selector: 'app-context-value-lookup',
  templateUrl: './lookup-context-value.component.html',
  styleUrls: ['./lookup-context-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    JsonPipe,
    ReactiveFormsModule,
    SciFormFieldModule,
    SciCheckboxModule,
    SciSashboxModule,
  ],
})
export default class LookupContextValueComponent implements OnDestroy {

  public form = this._formBuilder.group({
    key: this._formBuilder.control('', Validators.required),
    collect: this._formBuilder.control(false, Validators.required),
  });
  public observeValue: any;
  public lookupValue: any;
  public subscribeError: string | undefined;

  private _contextService: ContextService;
  private _subscription: Subscription | undefined;

  constructor(private _formBuilder: NonNullableFormBuilder, private _cd: ChangeDetectorRef) {
    this._contextService = Beans.get(ContextService);
  }

  public onSubscribe(): void {
    const key = this.form.controls.key.value;
    const options = {collect: this.form.controls.collect.value};
    this.form.controls.key.disable();
    this.form.controls.collect.disable();

    // Observe
    this._subscription = this._contextService.observe$(key, options)
      .subscribe({
        next: next => {
          this.observeValue = next;
          this._cd.markForCheck();
        },
        error: error => {
          this.subscribeError = error;
          this._cd.markForCheck();
        },
      });

    // Lookup
    this._contextService.lookup(key, options)
      .then(value => this.lookupValue = value)
      .catch(error => this.subscribeError = error)
      .finally(() => this._cd.markForCheck());
  }

  public onUnsubscribe(): void {
    this._subscription!.unsubscribe();
    this.form.controls.key.enable();
    this.form.controls.collect.enable();

    this.lookupValue = undefined;
    this.observeValue = undefined;
    this.subscribeError = undefined;
  }

  public get isSubscribed(): boolean {
    return !!this._subscription && !this._subscription.closed;
  }

  public ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }
}
