/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
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
import {observeInside, subscribeInside} from '@scion/toolkit/operators';

/**
 * Mirrors the source, but ensures subscription and emission {@link NgZone} to be identical.
 *
 * Angular applications expect an RxJS Observable to emit in the same Angular zone in which the subscription was
 * performed. That is, if subscribing inside the Angular zone, emissions are expected to be received inside the
 * Angular zone. Otherwise, the UI may not be updated as expected but delayed until the next change detection cycle.
 * Similarly, if subscribing outside the Angular zone, emissions are expected to be received outside the Angular
 * zone. Otherwise, this would cause unnecessary change detection cycles resulting in potential performance degradation.
 */
export class NgZoneObservableDecorator implements ObservableDecorator {

  constructor(private _zone: NgZone) {
  }

  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return new Observable<T>(observer => {
      const insideAngular = NgZone.isInAngularZone();
      const subscription = source$
        .pipe(
          subscribeInside(fn => this._zone.runOutsideAngular(fn)),
          observeInside(fn => insideAngular ? this._zone.run(fn) : this._zone.runOutsideAngular(fn)),
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    });
  }
}
