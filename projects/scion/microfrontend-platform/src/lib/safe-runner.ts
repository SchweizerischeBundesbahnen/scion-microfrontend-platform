/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { Logger } from './logger';
import { Beans } from '@scion/toolkit/bean-manager';

/**
 * Runs the given function. Errors are caught and logged.
 *
 * If producing a Promise, returns that Promise, but with a catch handler installed.
 *
 * @ignore
 */
export function runSafe<T = void>(runnable: () => T): T {
  let result: T;
  try {
    result = runnable();
  }
  catch (error) {
    Beans.get(Logger).error('[UnexpectedError] An unexpected error occurred.', error);
    return undefined;
  }

  if (result instanceof Promise) {
    return result.catch(error => {
      Beans.get(Logger).error('[UnexpectedError] An unexpected error occurred.', error);
      return undefined;
    }) as any;
  }
  return result;
}
