import {ObservableDecorator} from '@scion/microfrontend-platform';
import {inject, NgZone} from '@angular/core';
import {Observable} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {observeInside, subscribeInside} from '@scion/toolkit/operators';

// tag::ng-zone-observable-decorator[]
/**
 * Mirrors the source, but ensures subscription and emission {@link NgZone} to be identical.
 */
export class NgZoneObservableDecorator implements ObservableDecorator {

  constructor(private zone: NgZone) {
  }

  public decorate$<T>(source$: Observable<T>): Observable<T> {
    return new Observable<T>(observer => {
      const insideAngular = NgZone.isInAngularZone(); // <1>
      const subscription = source$
        .pipe(
          subscribeInside(fn => this.zone.runOutsideAngular(fn)), // <2>
          observeInside(fn => insideAngular ? this.zone.run(fn) : this.zone.runOutsideAngular(fn)), // <3>
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    });
  }
}

// end::ng-zone-observable-decorator[]

// tag::register-ng-zone-observable-decorator[]
const zone: NgZone = inject(NgZone); // <1>
Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)}); // <2>
// end::register-ng-zone-observable-decorator[]
