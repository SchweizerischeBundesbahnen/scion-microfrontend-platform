/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {PreferredSizeService} from '@scion/microfrontend-platform';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgIf} from '@angular/common';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';

@Component({
  selector: 'app-preferred-size',
  templateUrl: './preferred-size.component.html',
  styleUrls: ['./preferred-size.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    SciFormFieldModule,
    SciCheckboxModule,
  ],
})
export default class PreferredSizeComponent implements OnDestroy {

  public form = this._formBuilder.group({
    cssSize: this._formBuilder.group({
      width: this._formBuilder.control('', Validators.pattern(/^\d+px$/)),
      height: this._formBuilder.control('', Validators.pattern(/^\d+px$/)),
    }),
    preferredSize: this._formBuilder.group({
      width: this._formBuilder.control('', Validators.pattern(/^\d+px$/)),
      height: this._formBuilder.control('', Validators.pattern(/^\d+px$/)),
    }),
    useElementSize: this._formBuilder.control(false),
  }, {updateOn: 'blur'});

  public elementDimensionObservableBound: boolean | undefined;

  private _destroy$ = new Subject<void>();

  constructor(private _formBuilder: NonNullableFormBuilder, private _host: ElementRef<HTMLElement>) {
    this.form.controls.useElementSize.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(checked => {
        this.reset();
        this.form.controls.useElementSize.setValue(checked, {onlySelf: true, emitEvent: false});
      });

    this.form.controls.cssSize.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        setCssVariable(this._host, '--width', this.form.controls.cssSize.controls.width.value);
        setCssVariable(this._host, '--height', this.form.controls.cssSize.controls.height.value);
      });

    this.form.controls.preferredSize.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        const width = this.form.controls.preferredSize.controls.width.value;
        const height = this.form.controls.preferredSize.controls.height.value;
        Beans.get(PreferredSizeService).setPreferredSize({
          minWidth: width,
          width: width,
          maxWidth: width,
          minHeight: height,
          height: height,
          maxHeight: height,
        });
      });
  }

  public get isUseElementSize(): boolean {
    return this.form.controls.useElementSize.value;
  }

  public onElementObservableBind(): void {
    this.elementDimensionObservableBound = true;
    Beans.get(PreferredSizeService).fromDimension(this._host.nativeElement);
  }

  public onElementObservableUnbind(): void {
    this.elementDimensionObservableBound = false;
    Beans.get(PreferredSizeService).fromDimension(undefined);
  }

  public onElementUnmount(): void {
    this._host.nativeElement.parentElement!.removeChild(this._host.nativeElement);
  }

  public onResetClick(): void {
    this.reset();
  }

  private reset(): void {
    setCssVariable(this._host, '--width');
    setCssVariable(this._host, '--height');
    Beans.get(PreferredSizeService).fromDimension(undefined);
    Beans.get(PreferredSizeService).resetPreferredSize();
    this.elementDimensionObservableBound = false;
    this.form.reset(undefined, {emitEvent: false});
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

function setCssVariable(element: ElementRef<HTMLElement>, key: string, value?: any): void {
  if (value === undefined || value === null) {
    element.nativeElement.style.removeProperty(key);
  }
  else {
    element.nativeElement.style.setProperty(key, value);
  }
}
