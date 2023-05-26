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
import {Dictionary} from '@scion/toolkit/util';

/**
 * Extracts custom metadata associated with a param, if any, otherwise, returns `null`.
 */
@Pipe({name: 'devtoolsCustomParamMetadata', standalone: true})
export class CustomParamMetadataPipe implements PipeTransform {

  public readonly builtInProperties = new Set<string>()
    .add('name')
    .add('description')
    .add('deprecated')
    .add('required');

  public transform(param: ParamDefinition): Dictionary | null {
    const customProperties = Object.entries(param)
      .filter(entry => !this.builtInProperties.has(entry[0]))
      .reduce((acc, entry) => {
        acc[entry[0]] = entry[1];
        return acc;
      }, {});
    return Object.keys(customProperties).length ? customProperties : null;
  }
}
