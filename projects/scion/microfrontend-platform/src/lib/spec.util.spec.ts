/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { ApplicationManifest } from './platform.model';
import { AsyncSubject, Observer, ReplaySubject, throwError } from 'rxjs';
import { take, timeoutWith } from 'rxjs/operators';
import { Arrays } from '@scion/toolkit/util';

/**
 * Expects the given function to be rejected.
 *
 * Jasmine 3.5 provides 'expectAsync' expectation with the 'toBeRejectedWithError' matcher.
 * But, it does not support to test against a regular expression if the error is not of type 'Error'.
 *
 * The following expectation works:
 *   await expectAsync(Promise.reject(new Error("[SomeError] was thrown."))).toBeRejectedWithError(/SomeError/);
 *
 * Whereas rejecting by providing only a string value doesn't:
 *   await expectAsync(Promise.reject("[SomeError] was thrown.")).toBeRejectedWithError(/SomeError/);
 *
 * @see https://jasmine.github.io/api/3.5/async-matchers.html
 */
export function expectToBeRejectedWithError(promise: Promise<any>, expected?: RegExp): Promise<void> {
  const reasonExtractorFn = (reason: any): string => {
    if (typeof reason === 'string') {
      return reason;
    }
    if (reason instanceof Error) {
      return reason.message;
    }
    return reason.toString();
  };

  return promise
    .then(() => fail('Promise expected to be rejected but was resolved.'))
    .catch(reason => {
      if (expected && !reasonExtractorFn(reason).match(expected)) {
        fail(`Expected promise to be rejected with a reason matching '${expected.source}', but was '${reason}'.`);
      }
      else {
        expect(true).toBeTrue();
      }
    });
}

export interface ToContainMatcher {
  toContain(expected: Map<any, any>): Promise<void>;
}

/***
 * Serves the given manifest and returns the URL where the manifest is served.
 */
export function serveManifest(manifest: Partial<ApplicationManifest>): string {
  return URL.createObjectURL(new Blob([JSON.stringify(manifest)], {type: 'application/json'}));
}

/**
 * Returns a Promise that resolves after the given millis elapses.
 */
export function waitFor(millis: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millis)); // tslint:disable-line:typedef
}

/**
 * Returns a Promise that resolves when the condition returns `true` or that rejects when the timeout expires.
 */
export function waitForCondition(condition: () => boolean | Promise<boolean>, timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {  // tslint:disable-line:typedef
    const expiryDate = Date.now() + timeout;
    const periodicConditionCheckerFn = async (): Promise<void> => {
      if (await condition()) {
        resolve();
      }
      else if (Date.now() > expiryDate) {
        reject(`[SpecTimeoutError] Timeout elapsed. Condition not fulfilled within ${timeout}ms.`);
      }
      else {
        setTimeout(periodicConditionCheckerFn, 10);
      }
    };
    periodicConditionCheckerFn().then();
  });
}

/**
 * Allows capturing emissions of an Observable.
 */
export class ObserveCaptor<T = any, R = T> implements Observer<T> {

  private _projectFn: (value: T) => R;

  private _values: R[] = [];
  private _completed = false;
  private _error: any;

  private _completeOrError$ = new AsyncSubject<void>();
  private _emitCount$ = new ReplaySubject<void>();

  constructor(projectFn?: (value: T) => R) {
    this._projectFn = projectFn || ((value) => value as any);
  }

  /**
   * @internal
   */
  public next = (value: T): void => {
    this._values.push(this._projectFn(value));
    this._emitCount$.next();
  }

  /**
   * @internal
   */
  public error = (error: any): void => {
    this._error = error;
    this._completeOrError$.complete();
  }

  /**
   * @internal
   */
  public complete = (): void => {
    this._completed = true;
    this._completeOrError$.complete();
  }

  public getValues(): R[] {
    return this._values;
  }

  public getLastValue(): R {
    return this._values[this._values.length - 1];
  }

  public getError(): any {
    return this._error;
  }

  public hasCompleted(): boolean {
    return this._completed;
  }

  public hasErrored(): boolean {
    return this._error !== undefined;
  }

  /**
   * Waits until the Observable emits the given number of items, or throws if the given timeout elapses.
   */
  public async waitUntilEmitCount(count: number, timeout: number = 5000): Promise<void> {
    return this._emitCount$
      .pipe(
        take(count),
        timeoutWith(new Date(Date.now() + timeout), throwError('[SpecTimeoutError] Timeout elapsed.')),
      )
      .toPromise();
  }

  /**
   * Waits until the Observable completes or errors.
   */
  public async waitUntilCompletedOrErrored(): Promise<void> {
    return this._completeOrError$.toPromise();
  }
}

/**
 * Expects the {@link ObserveCaptor} to capture given emissions. This expectation waits a maximum of 5 seconds until the expected element count
 * is captured.
 */
export function expectEmissions<T = any, R = T>(captor: ObserveCaptor<T, R>): { toEqual: (expected: R | R[]) => Promise<boolean> } {
  return {
    toEqual: async (expected: R | R[]): Promise<boolean> => {
      const expectedValues = Arrays.coerce(expected);
      await captor.waitUntilEmitCount(expectedValues.length, 5000);
      return expect(captor.getValues()).toEqual(expectedValues);
    },
  };
}
