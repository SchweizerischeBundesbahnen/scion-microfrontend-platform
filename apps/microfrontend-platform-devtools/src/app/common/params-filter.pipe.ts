/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
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
 * Filters required or optional parameters.
 */
@Pipe({name: 'devtoolsParamsFilter'})
export class ParamsFilterPipe implements PipeTransform {

  public transform(params: ParamDefinition[] | undefined | null, filter?: 'required' | 'optional'): ParamDefinition[] {
    return params?.filter(param => !filter || (filter === 'required' ? param.required : !param.required)) ?? [];
  }
}
