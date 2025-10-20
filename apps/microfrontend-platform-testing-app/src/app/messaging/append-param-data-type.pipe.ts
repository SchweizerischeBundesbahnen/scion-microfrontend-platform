/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Pipe, PipeTransform} from '@angular/core';

/**
 * Returns a new {@link Map} with the actual data type of each parameter appended to its value in square brackets.
 *
 * Examples:
 * - `Jack [string]`
 * - `1234 [number]`
 * - `true [boolean]`
 * - `null [null]`
 * - `undefined [undefined]`
 */
@Pipe({name: 'appAppendParamDataType'})
export class AppendParamDataTypePipe implements PipeTransform {

  public transform(params: Map<string, unknown> | undefined): Map<string, unknown> | undefined {
    if (params === undefined) {
      return undefined;
    }
    return Array.from(params.entries()).reduce((acc, [key, value]) => {
      return acc.set(key, `${value} [${typeOf(value)}]`);
    }, new Map());
  }
}

function typeOf(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  return typeof value;
}
