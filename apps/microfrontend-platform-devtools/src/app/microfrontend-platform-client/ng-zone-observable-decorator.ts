/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {NgZone} from '@angular/core';
import {ObservableDecorator} from '@scion/microfrontend-platform';
import {Observable} from 'rxjs';
import {observeIn, subscribeIn} from '@scion/toolkit/operators';

/**
 * Mirrors the source, but ensures subscription and emission {@link NgZone} to be identical.
 */
export class NgZoneObservableDecorator implements ObservableDecorator {

  constructor(private _zone: NgZone) {
  }

  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return new Observable<T>(observer => {
      const insideAngular = NgZone.isInAngularZone();
      const subscription = source$
        .pipe(
          subscribeIn(fn => this._zone.runOutsideAngular(fn)),
          observeIn(fn => insideAngular ? this._zone.run(fn) : this._zone.runOutsideAngular(fn)),
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    });
  }
}
