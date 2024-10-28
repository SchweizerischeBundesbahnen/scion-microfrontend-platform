/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MonoTypeOperatorFunction, Observable} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Enables the decoration of RxJS Observables provided by the SCION Microfrontend Platform to control their emission context.
 *
 * The emission context of an Observables may be different than the subscription context, which can lead to unexpected behavior
 * on the subscriber side. For example, Angular uses zones (Zone.js) to trigger change detection. Angular applications expect
 * an RxJS Observable to emit in the same Angular zone in which subscribed to the Observable. That is, if subscribing inside
 * the Angular zone, emissions are expected to be received inside the Angular zone. Otherwise, the UI may not be updated as
 * expected but delayed until the next change detection cycle. Similarly, if subscribing outside the Angular zone, emissions
 * are expected to be received outside the Angular zone. Otherwise, this would cause unnecessary change detection cycles
 * resulting in potential performance degradation.
 *
 * ### Example for Angular Applications
 *
 * For Angular applications, we reommend installing the following decorator:
 *
 * ```ts
 * import {NgZone} from '@angular/core';
 * import {ObservableDecorator} from '@scion/microfrontend-platform';
 * import {Observable} from 'rxjs';
 * import {observeIn, subscribeIn} from '@scion/toolkit/operators';
 *
 * export class NgZoneObservableDecorator implements ObservableDecorator {
 *
 *   constructor(private zone: NgZone) {
 *   }
 *
 *   public decorate$<T>(source$: Observable<T>): Observable<T> {
 *      return new Observable<T>(observer => {
 *        const insideAngular = NgZone.isInAngularZone();
 *        const subscription = source$
 *          .pipe(
 *            subscribeIn(fn => this.zone.runOutsideAngular(fn)),
 *            observeIn(fn => insideAngular ? this.zone.run(fn) : this.zone.runOutsideAngular(fn)),
 *          )
 *          .subscribe(observer);
 *        return () => subscription.unsubscribe();
 *      });
 *    }
 * }
 * ```
 *
 * A decorator can be registered with the bean manager under the symbol `ObservableDecorator`, as following:
 *
 * ```ts
 * Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});
 * ```
 *
 * @category Messaging
 */
export abstract class ObservableDecorator {

  /**
   * Decorates given Observable.
   *
   * @param  source$ - Observable to be decorated.
   * @return Decorated Observable.
   */
  public abstract decorate$<T>(source$: Observable<T>): Observable<T>;
}

/**
 * Decorates the source with registered {@link ObservableDecorator}, if any.
 *
 * @internal
 */
export function decorateObservable<T>(): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => Beans.opt(ObservableDecorator)?.decorate$(source$) ?? source$;
}
