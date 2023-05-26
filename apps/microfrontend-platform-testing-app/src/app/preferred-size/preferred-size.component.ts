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
import {ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {PreferredSizeService} from '@scion/microfrontend-platform';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgIf} from '@angular/common';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';

export const CSS_SIZE = 'cssSize';
export const PREFERRED_SIZE = 'preferredSize';
export const WIDTH = 'width';
export const HEIGHT = 'height';
export const USE_ELEMENT_SIZE = 'useElementSize';

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

  public CSS_SIZE = CSS_SIZE;
  public PREFERRED_SIZE = PREFERRED_SIZE;
  public WIDTH = WIDTH;
  public HEIGHT = HEIGHT;
  public USE_ELEMENT_SIZE = USE_ELEMENT_SIZE;

  public form: UntypedFormGroup;
  public elementDimensionObservableBound: boolean;

  private _destroy$ = new Subject<void>();

  constructor(formBuilder: UntypedFormBuilder, private _host: ElementRef<HTMLElement>) {
    this.form = formBuilder.group({
      [CSS_SIZE]: formBuilder.group({
        [WIDTH]: new UntypedFormControl('', Validators.pattern(/^\d+px$/)),
        [HEIGHT]: new UntypedFormControl('', Validators.pattern(/^\d+px$/)),
      }),
      [PREFERRED_SIZE]: formBuilder.group({
        [WIDTH]: new UntypedFormControl('', Validators.pattern(/^\d+px$/)),
        [HEIGHT]: new UntypedFormControl('', Validators.pattern(/^\d+px$/)),
      }),
      [USE_ELEMENT_SIZE]: new UntypedFormControl(false),
    }, {updateOn: 'blur'});

    this.form.get(USE_ELEMENT_SIZE).valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(checked => {
        this.reset();
        this.form.get(USE_ELEMENT_SIZE).setValue(checked, {onlySelf: true, emitEvent: false});
      });

    this.form.get(CSS_SIZE).valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        setCssVariable(this._host, '--width', this.form.get(CSS_SIZE).get(WIDTH).value);
        setCssVariable(this._host, '--height', this.form.get(CSS_SIZE).get(HEIGHT).value);
      });

    this.form.get(PREFERRED_SIZE).valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        const width = this.form.get(PREFERRED_SIZE).get(WIDTH).value;
        const height = this.form.get(PREFERRED_SIZE).get(HEIGHT).value;
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
    return this.form.get(USE_ELEMENT_SIZE).value;
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
    this._host.nativeElement.parentElement.removeChild(this._host.nativeElement);
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
