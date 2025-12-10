/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Pipe, PipeTransform} from '@angular/core';
import {ParamDefinition} from '@scion/microfrontend-platform';

/**
 * Extracts custom metadata associated with a param, if any, otherwise, returns `null`.
 */
@Pipe({name: 'devtoolsCustomParamMetadata'})
export class CustomParamMetadataPipe implements PipeTransform {

  public readonly builtInProperties = new Set<string>()
    .add('name')
    .add('description')
    .add('deprecated')
    .add('required')
    .add('default');

  public transform(param: ParamDefinition): Record<string, unknown> | null {
    const customProperties = Object.entries(param)
      .filter(([key]) => !this.builtInProperties.has(key))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, unknown>);
    return Object.keys(customProperties).length ? customProperties : null;
  }
}
