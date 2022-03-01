/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Beans} from '@scion/toolkit/bean-manager';
import {APP_IDENTITY} from './platform.model';
import {VERSION} from './version';

/**
 * Logger used by the platform to log to the console.
 *
 * Replace this bean to capture the log output.
 *
 * @category Platform
 */
export abstract class Logger {

  /**
   * Logs with severity debug.
   */
  public abstract debug(message?: any, ...args: any[]): void;

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

  public debug(message?: any, ...args: any[]): void {
    this.log('debug', message, args);
  }

  public info(message?: any, ...args: any[]): void {
    this.log('info', message, args);
  }

  public warn(message?: any, ...args: any[]): void {
    this.log('warn', message, args);
  }

  public error(message?: any, ...args: any[]): void {
    this.log('error', message, args);
  }

  private log(severity: 'debug' | 'info' | 'warn' | 'error', message: any, args: any[]): void {
    const loggingContext: LoggingContext = args[0] instanceof LoggingContext ? args.shift() : {appSymbolicName: Beans.get(APP_IDENTITY), version: Beans.get(VERSION)};
    const prefix = new Array<string>()
      .concat(loggingContext.version ? `[@scion/microfrontend-platform@${loggingContext.version}]` : '[@scion/microfrontend-platform]')
      .concat(`[${loggingContext.appSymbolicName}]`)
      .join('');

    if (console && typeof console[severity] === 'function') {
      const consoleFn = console[severity];
      args?.length ? consoleFn(`${prefix} ${message}`, ...args) : consoleFn(`${prefix} ${message}`);
    }
  }
}

/**
 * Logger that does nothing.
 *
 * @ignore
 */
export const NULL_LOGGER = new class extends Logger {

  public debug(message?: any, ...args: any[]): void {
    // NOOP
  }

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

/**
 * Contextual information to add to the log message.
 *
 * Pass an instance of this class as the first argument to the logger when logging a message.
 */
export class LoggingContext {

  constructor(public appSymbolicName: string, public version?: string) {
  }
}
