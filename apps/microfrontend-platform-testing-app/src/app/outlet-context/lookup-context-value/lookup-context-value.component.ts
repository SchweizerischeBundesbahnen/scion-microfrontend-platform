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
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Beans} from '@scion/toolkit/bean-manager';
import {ContextService} from '@scion/microfrontend-platform';
import {Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

const KEY = 'key';
const COLLECT = 'collect';

@Component({
  selector: 'app-context-value-lookup',
  templateUrl: './lookup-context-value.component.html',
  styleUrls: ['./lookup-context-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupContextValueComponent implements OnDestroy {

  public KEY = KEY;
  public COLLECT = COLLECT;

  public form: FormGroup;
  public observeValue: any;
  public lookupValue: any;
  public subscribeError: string;

  private _contextService: ContextService;
  private _subscription: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(private _formBuilder: FormBuilder, private _cd: ChangeDetectorRef) {
    this._contextService = Beans.get(ContextService);
    this.form = this._formBuilder.group({
      [KEY]: new FormControl('', Validators.required),
      [COLLECT]: new FormControl(false, Validators.required),
    });
  }

  public onSubscribe(): void {
    const key = this.form.get(KEY).value;
    const options = {collect: this.form.get(COLLECT).value};
    this.form.get(KEY).disable();
    this.form.get(COLLECT).disable();

    // Observe
    this._subscription = this._contextService.observe$(key, options)
      .pipe(takeUntil(this._destroy$))
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
    this._subscription.unsubscribe();
    this.form.get(KEY).enable();
    this.form.get(COLLECT).enable();

    this.lookupValue = undefined;
    this.observeValue = undefined;
    this.subscribeError = undefined;
  }

  public get isSubscribed(): boolean {
    return this._subscription && !this._subscription.closed;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
