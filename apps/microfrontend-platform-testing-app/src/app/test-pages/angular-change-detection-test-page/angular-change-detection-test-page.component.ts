/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, DestroyRef, ElementRef, Inject, LOCALE_ID, NgZone, OnInit, ViewChild} from '@angular/core';
import {debounceTime, fromEvent, Subject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {formatDate} from '@angular/common';
import {subscribeInside} from '@scion/toolkit/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-angular-change-detection-test-page',
  templateUrl: './angular-change-detection-test-page.component.html',
  styleUrls: ['./angular-change-detection-test-page.component.scss'],
  standalone: true,
})
export default class AngularChangeDetectionTestPageComponent implements OnInit {

  private _changeDetectionCycle$ = new Subject<void>();

  @ViewChild('angular_change_detection_indicator', {static: true})
  private _changeDetectionIndicatorElement!: ElementRef<HTMLElement>;

  @ViewChild('angular_change_detection_cycles', {static: true})
  private _changeDetectionCyclesElement!: ElementRef<HTMLTextAreaElement>;

  @ViewChild('angular_change_detection_cycles_clear', {static: true})
  private _clearLogButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('element', {static: true})
  private _element!: ElementRef<HTMLTextAreaElement>;

  @ViewChild('preventdefault_on_mousedown', {static: true})
  private _preventdefaultOnMousedownCheckbox!: ElementRef<HTMLInputElement>;

  constructor(private _zone: NgZone,
              private _destroyRef: DestroyRef,
              @Inject(LOCALE_ID) private locale: string) {
    this.installChangeDetectionIndicator();
  }

  public ngOnInit(): void {
    // Install event listeners directly on DOM elements to not trigger change detection.
    fromEvent(this._element.nativeElement, 'mousedown')
      .pipe(
        subscribeInside(fn => this._zone.runOutsideAngular(fn)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(event => {
        if (this._preventdefaultOnMousedownCheckbox.nativeElement.checked) {
          event.preventDefault();
        }
      });

    fromEvent(this._clearLogButton.nativeElement, 'click')
      .pipe(
        subscribeInside(fn => this._zone.runOutsideAngular(fn)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this._changeDetectionCyclesElement.nativeElement.value = '';
      });
  }

  /**
   * Method invoked on each Angular change detection cycle.
   */
  public get onChangeDetectionCycle(): void {
    this._zone.runOutsideAngular(() => this._changeDetectionCycle$.next());
    return undefined as void;
  }

  private installChangeDetectionIndicator(): void {
    this._changeDetectionCycle$
      .pipe(
        tap(() => NgZone.assertNotInAngularZone()),
        tap(() => {
          this._changeDetectionIndicatorElement.nativeElement.classList.add('active');
          this._changeDetectionCyclesElement.nativeElement.value = new Array<string>()
            .concat(`${formatDate(Date.now(), 'hh:mm:ss:SSS', this.locale)}\tChange detection cycle`)
            .concat(this._changeDetectionCyclesElement.nativeElement.value)
            .filter(Boolean)
            .join('\n');
        }),
        debounceTime(500),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this._changeDetectionIndicatorElement.nativeElement.classList.remove('active');
      });
  }
}
