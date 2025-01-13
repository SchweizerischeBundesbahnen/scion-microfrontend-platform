/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Pipe, PipeTransform, Type} from '@angular/core';

/**
 * Casts given value to given type.
 */
@Pipe({name: 'appAs'})
export class AppAsPipe implements PipeTransform {

  public transform<T>(value: unknown, type: Type<T>): T {
    return value as T;
  }
}
