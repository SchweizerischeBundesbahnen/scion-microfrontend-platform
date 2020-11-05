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
 * Runs the given function. Errors are catched and logged.
 *
 * @ignore
 */
export function runSafe<T = void>(runnable: () => T): T {
  try {
    return runnable();
  }
  catch (error) {
    Beans.get(Logger).error('[UnexpectedError] An unexpected error occurred.', error);
  }
}
