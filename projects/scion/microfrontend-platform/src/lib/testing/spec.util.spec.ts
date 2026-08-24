/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Arrays} from '@scion/toolkit/util';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {ConsoleLogger, Logger} from '../logger';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from '../client/messaging/message-client';
import {first} from 'rxjs/operators';
import {stringifyError} from '../error.util';
import {exhaustMap, filter, firstValueFrom, map, pairwise, timer} from 'rxjs';
import type {Mock} from 'vitest';

/**
 * Expects the given Promise to either resolve or reject.
 *
 * Prefer this expectation over Jasmine `expectAsync` as we experienced unexpected behavior. The `expectAsync` expectation was added to Jasmine in version 3.5.
 *
 * - Jasmine `toBeRejectedWithError` matcher does not support to test against a regular expression if the error is not of type 'Error'
 * - Jasmine `toBeResolved` sometimes does not wait for the Promise to resolve. We did not investigate this further.
 *
 * @see https://jasmine.github.io/api/3.5/async-matchers.html
 *
 * TODO do we need thos custom matcher?
 * https://vitest.dev/guide/learn/async.html#resolves-and-rejects
 */
export function expectPromise(actual: Promise<unknown>): PromiseMatcher {
  return {
    toResolve: async (expected?: unknown): Promise<void> => {
      try {
        const value = await actual;
        if (expected !== undefined) {
          expect(value).toEqual(expected);
        }
        else {
          expect(true).toBe(true);
        }
      }
      catch (reason) {
        throw new Error(`Promise expected to be resolved but was rejected: ${reason}`, {cause: reason});
      }
    },
    toReject: async (expected?: RegExp): Promise<void> => {
      try {
        const value = await actual;
        throw new Error(`Promise expected to be rejected but was resolved: ${value}`);
      }
      catch (reason) {
        if (expected && !stringifyError(reason).match(expected)) {
          throw new Error(`Expected promise to be rejected with a reason matching '${expected.source}', but was '${(stringifyError(reason))}'.`, {cause: reason});
        }
        else {
          expect(true).toBe(true);
        }
      }
    },
  };
}

export interface PromiseMatcher {
  /**
   * Expects the Promise to resolve. If passing an expected value, also performs an equality test.
   * You can wrap your expectation inside the `objectContaining` or `mapContaining` matcher to test for partial equality.
   */
  toResolve(expected?: unknown): Promise<void>;

  /**
   * Expects the Promise to reject. If passing a regular expression, also tests the error to match the regex.
   */
  toReject(expected?: RegExp): Promise<void>;
}

export function arrayWithExactContents<T>(expectedItems: T[]): T[] {
  return {
    asymmetricMatch: (actual: unknown): boolean => {
      if (!Array.isArray(actual) || actual.length !== expectedItems.length) {
        return false;
      }

      const unmatchedIndices = new Set(actual.map((_, index) => index));
      for (const expectedItem of expectedItems) {
        const matchedIndex = [...unmatchedIndices].find(index => {
          try {
            expect(actual[index]).toEqual(expectedItem);
            return true;
          }
          catch {
            return false;
          }
        });
        if (matchedIndex === undefined) {
          return false;
        }
        unmatchedIndices.delete(matchedIndex);
      }
      return unmatchedIndices.size === 0;
    },
  } as unknown as T[];
}

/**
 * Returns a Promise that resolves after the given millis elapses.
 */
export function waitFor(millis: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millis));
}

/**
 * Returns a Promise that resolves when the condition returns `true` or that rejects when the timeout expires.
 */
export function waitForCondition(condition: () => boolean | Promise<boolean>, timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const expiryDate = Date.now() + timeout;
    const periodicConditionCheckerFn = async (): Promise<void> => {
      if (await condition()) {
        resolve();
      }
      else if (Date.now() > expiryDate) {
        reject(Error(`[SpecTimeoutError] Timeout elapsed. Condition not fulfilled within ${timeout}ms.`));
      }
      else {
        setTimeout(() => void periodicConditionCheckerFn(), 10);
      }
    };
    void periodicConditionCheckerFn();
  });
}

/**
 * Waits for a value to become stable.
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 100ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A> | A, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
  const value$ = timer(0, options?.probeInterval ?? 100)
    .pipe(
      exhaustMap(async () => await value()),
      pairwise(),
      filter(([previous, current]) => options?.isStable ? options.isStable(previous, current) : previous === current),
      map(([previous]) => previous),
    );
  return firstValueFrom(value$);
}

/**
 * Expects the {@link ObserveCaptor} to capture given emissions. This expectation waits a maximum of 5 seconds until the expected element count
 * is captured.
 */
export function expectEmissions<T = unknown, R = T>(captor: ObserveCaptor<T, R>): ToEqualMatcher<R | R[]> & {not: ToEqualMatcher<R | R[]>} {
  return {
    toEqual: async (expected: R | R[]): Promise<void> => {
      const expectedValues = Arrays.coerce(expected);
      await captor.waitUntilEmitCount(expectedValues.length, 5000);
      expect(captor.getValues()).toEqual(expectedValues);
    },
    not: {
      toEqual: async (expected: R | R[]): Promise<void> => {
        const expectedValues = Arrays.coerce(expected);
        await captor.waitUntilEmitCount(expectedValues.length, 5000);
        expect(captor.getValues()).not.toEqual(expectedValues);
      },
    },
  };
}

export interface ToEqualMatcher<T> {
  toEqual(expected: T): Promise<void>;
}

export function installLoggerSpies(): void {
  const logger = new ConsoleLogger();
  vi.spyOn(logger, 'info');
  vi.spyOn(logger, 'warn');
  vi.spyOn(logger, 'error');
  Beans.register(Logger, {useValue: logger});
}

export function readConsoleLog(severity: 'info' | 'warn' | 'error', options?: {filter?: RegExp; projectFn?: (call: MockCall) => string}): string[] {
  return vi.mocked(getLoggerSpy(severity)).mock.calls.map(call => options?.projectFn ? options.projectFn(call) : call[0] as string)
    .filter(msg => options?.filter ? msg.match(options.filter) !== null : true);
}

type MockCall = Parameters<(...args: unknown[]) => unknown>;

export function getLoggerSpy(severity: 'info' | 'warn' | 'error'): Mock {
  switch (severity) {
    case 'info':
      return Beans.get(Logger).info as Mock;
    case 'warn':
      return Beans.get(Logger).warn as Mock;
    case 'error':
      return Beans.get(Logger).error as Mock;
    default:
      throw Error(`[SpecError] Unsupported severity for logger spy. Expected one of ['info', 'warn', 'error'], but was '${severity}'.`);
  }
}

export function resetLoggerSpy(severity: 'info' | 'warn' | 'error'): void {
  getLoggerSpy(severity).mockClear();
}

/**
 * Waits until the given number of subscribers are subscribed to the given topic, or throws an error otherwise.
 */
export async function waitUntilSubscriberCount(topic: string, expectedCount: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Beans.get(MessageClient).subscriberCount$(topic)
      .pipe(first(count => count === expectedCount))
      .subscribe({
        error: reject,
        complete: resolve,
      });
  });
}

/**
 * Synchronization to wait until some operation completes.
 */
export class Latch {
  /**
   * Releases this latch.
   */
  public release!: () => void;

  /**
   * Promise that resolves when released this latch.
   */
  public whenReleased = new Promise<void>(resolve => this.release = resolve);
}
