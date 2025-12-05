/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, effect, ElementRef, inject, LOCALE_ID, NgZone, untracked, viewChild} from '@angular/core';
import {debounceTime, fromEvent, Subject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {formatDate} from '@angular/common';
import {subscribeIn} from '@scion/toolkit/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-angular-change-detection-test-page',
  templateUrl: './angular-change-detection-test-page.component.html',
  styleUrls: ['./angular-change-detection-test-page.component.scss'],
})
export default class AngularChangeDetectionTestPageComponent {

  private readonly _zone = inject(NgZone);
  private readonly locale = inject(LOCALE_ID);
  private readonly _changeDetectionIndicatorElement = viewChild.required<ElementRef<HTMLElement>>('angular_change_detection_indicator');
  private readonly _changeDetectionCyclesElement = viewChild.required<ElementRef<HTMLTextAreaElement>>('angular_change_detection_cycles');
  private readonly _clearLogButton = viewChild.required<ElementRef<HTMLButtonElement>>('angular_change_detection_cycles_clear');
  private readonly _element = viewChild.required<ElementRef<HTMLTextAreaElement>>('element');
  private readonly _preventDefaultOnMousedownCheckbox = viewChild.required<ElementRef<HTMLInputElement>>('preventdefault_on_mousedown');
  private readonly _changeDetectionCycle$ = new Subject<void>();

  constructor() {
    this.installChangeDetectionIndicator();
    this.installPreventDefaultListener();
    this.installClearLogListener();
  }

  /**
   * Method invoked on each Angular change detection cycle.
   */
  public get onChangeDetectionCycle(): void {
    this._zone.runOutsideAngular(() => this._changeDetectionCycle$.next());
    return undefined as void;
  }

  private installChangeDetectionIndicator(): void {
    effect(onCleanup => {
      const changeDetectionIndicatorElement = this._changeDetectionIndicatorElement().nativeElement;
      const changeDetectionCyclesElement = this._changeDetectionCyclesElement().nativeElement;

      untracked(() => {
        const subscription = this._changeDetectionCycle$
          .pipe(
            tap(() => NgZone.assertNotInAngularZone()),
            tap(() => {
              changeDetectionIndicatorElement.classList.add('active');
              changeDetectionCyclesElement.value = new Array<string>()
                .concat(`${formatDate(Date.now(), 'hh:mm:ss:SSS', this.locale)}\tChange detection cycle`)
                .concat(changeDetectionCyclesElement.value)
                .filter(Boolean)
                .join('\n');
            }),
            debounceTime(500),
            takeUntilDestroyed(),
          )
          .subscribe(() => {
            changeDetectionIndicatorElement.classList.remove('active');
          });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private installPreventDefaultListener(): void {
    effect(onCleanup => {
      const preventDefaultOnMousedownCheckboxElement = this._preventDefaultOnMousedownCheckbox().nativeElement;
      const element = this._element().nativeElement;

      untracked(() => {
        // Install event listener directly on DOM element to not trigger change detection.
        const subscription = fromEvent(element, 'mousedown')
          .pipe(subscribeIn(fn => this._zone.runOutsideAngular(fn)))
          .subscribe(event => {
            if (preventDefaultOnMousedownCheckboxElement.checked) {
              event.preventDefault();
            }
          });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private installClearLogListener(): void {
    effect(onCleanup => {
      const clearLogButton = this._clearLogButton().nativeElement;
      const changeDetectionCyclesElement = this._changeDetectionCyclesElement().nativeElement;

      untracked(() => {
        // Install event listener directly on DOM element to not trigger change detection.
        const subscription = fromEvent(clearLogButton, 'click')
          .pipe(subscribeIn(fn => this._zone.runOutsideAngular(fn)))
          .subscribe(() => changeDetectionCyclesElement.value = '');

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
