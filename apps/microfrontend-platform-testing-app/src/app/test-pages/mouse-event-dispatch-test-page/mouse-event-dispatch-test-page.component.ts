/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectorRef, Component, DestroyRef, effect, inject, untracked, viewChild} from '@angular/core';
import {fromEvent, merge} from 'rxjs';
import {DatePipe} from '@angular/common';
import {SciViewportComponent} from '@scion/components/viewport';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-mouse-event-dispatch-test-page',
  templateUrl: './mouse-event-dispatch-test-page.component.html',
  styleUrls: ['./mouse-event-dispatch-test-page.component.scss'],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    SciViewportComponent,
    SciCheckboxComponent,
  ],
})
export default class MouseEventDispatchTestPageComponent {

  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _viewport = viewChild.required(SciViewportComponent);

  protected readonly dispatchedEvents = new Array<DispatchedEvent>();
  protected readonly followTailFormControl = new FormControl<boolean>(true);

  constructor() {
    this.installEventsListener();
  }

  protected onClearDispatchedEvent(): void {
    this.dispatchedEvents.length = 0;
  }

  private installEventsListener(): void {
    effect(onCleanup => {
      const viewport = this._viewport();

      untracked(() => {
        const subscription = merge(fromEvent(document, 'sci-mousemove'), fromEvent(document, 'sci-mouseup'))
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe(event => {
            this.dispatchedEvents.push({type: event.type, timestamp: Date.now()});
            if (this.followTailFormControl.value) {
              this._cd.detectChanges();
              viewport.scrollTop = viewport.scrollHeight;
            }
          });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}

export interface DispatchedEvent {
  type: string;
  timestamp: number;
}
