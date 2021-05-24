/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DevToolsManifestService } from './dev-tools-manifest.service';

/**
 * Resolves to the name of an application's symbolic name.
 */
@Pipe({name: 'devtoolsAppName'})
export class AppNamePipe implements PipeTransform {

  constructor(private _manifestService: DevToolsManifestService) {
  }

  public transform(symbolicName: string): string | undefined {
    return this._manifestService.getApplication(symbolicName)?.name;
  }
}
