/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/**
 * Logger used by the platform to log to the console.
 *
 * Replace this bean to capture the log output.
 *
 * @category Platform
 */
export abstract class Logger {

  /**
   * Logs with severity info.
   */
  public abstract info(message?: any, ...args: any[]): void;

  /**
   * Logs with severity warn.
   */
  public abstract warn(message?: any, ...args: any[]): void;

  /**
   * Logs with severity error.
   */
  public abstract error(message?: any, ...args: any[]): void;
}

/**
 * Logger used by the platform to log to the console.
 *
 * Replace this bean to capture the log output.
 *
 * @internal
 */
export class ConsoleLogger implements Logger {

  /**
   * Logs with severity info.
   */
  public info(message?: any, ...args: any[]): void {
    this.log('info', message, args);
  }

  /**
   * Logs with severity warn.
   */
  public warn(message?: any, ...args: any[]): void {
    this.log('warn', message, args);
  }

  /**
   * Logs with severity error.
   */
  public error(message?: any, ...args: any[]): void {
    this.log('error', message, args);
  }

  private log(severity: 'info' | 'warn' | 'error', message: any, args: any[]): void {
    message = `[sci] ${message}`;
    if (console && typeof console[severity] === 'function') {
      const consoleFn = console[severity];
      (args && args.length) ? consoleFn(message, ...args) : consoleFn(message);
    }
  }
}

/**
 * Logger that does nothing.
 *
 * @ignore
 */
export const NULL_LOGGER = new class extends Logger { // tslint:disable-line:new-parens

  public info(message?: any, ...args: any[]): void {
    // NOOP
  }

  public warn(message?: any, ...args: any[]): void {
    // NOOP
  }

  public error(message?: any, ...args: any[]): void {
    // NOOP
  }
};
