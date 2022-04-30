/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ParamDefinition} from '../../platform.model';

/**
 * Allows testing whether params match the param definitions.
 * @ignore
 */
export class ParamMatcher {

  private readonly _requiredParamDefs = new Array<ParamDefinition>();
  private readonly _optionalParamDefs = new Array<ParamDefinition>();
  private readonly _deprecatedParamDefs = new Array<ParamDefinition>();

  constructor(definitions: ParamDefinition[]) {
    definitions.forEach(paramDef => {
      if (paramDef.required ?? true) {
        this._requiredParamDefs.push(paramDef);
      }
      else {
        this._optionalParamDefs.push(paramDef);
      }

      if (paramDef.deprecated) {
        this._deprecatedParamDefs.push(paramDef);
      }
    });
  }

  /**
   * Tests if the given params match the param definitions.
   */
  public match(parameters: Map<string, any> | undefined): ParamsMatcherResult {
    const params = new Map(parameters || []);

    const matcherResult: ParamsMatcherResult = {
      matches: true,
      params,
      missingParams: [],
      unexpectedParams: [],
      deprecatedParams: [],
    };

    // Test if deprecated params are passed and map them to their substitute, if any.
    this._deprecatedParamDefs
      .filter(paramDef => params.has(paramDef.name))
      .forEach(paramDef => {
        matcherResult.deprecatedParams.push(paramDef);

        // Try mapping the deprecated param to its substitute.
        const deprecation = paramDef.deprecated;
        if (typeof deprecation === 'object' && deprecation.useInstead) {
          params.set(deprecation.useInstead, params.get(paramDef.name));
          params.delete(paramDef.name);
        }
      });

    // Test if required params are passed.
    this._requiredParamDefs
      .filter(paramDef => !params.has(paramDef.name) || params.get(paramDef.name) === undefined)
      .filter(paramDef => !this._deprecatedParamDefs.includes(paramDef))
      .forEach(paramDef => {
        matcherResult.matches = false;
        matcherResult.missingParams.push(paramDef);
      });

    // Test if no additional params are passed.
    Array.from(params.keys())
      .filter(param => !this._requiredParamDefs.some(paramDef => paramDef.name === param) && !this._optionalParamDefs.some(paramDef => paramDef.name === param))
      .forEach(param => {
        matcherResult.matches = false;
        matcherResult.unexpectedParams.push(param);
      });

    if (!matcherResult.matches) {
      matcherResult.params = undefined;
    }

    return matcherResult;
  }
}

/**
 * Represents the result of a params matcher test.
 * @ignore
 */
export interface ParamsMatcherResult {
  /**
   * Indicates whether the params match the param definitions.
   */
  matches: boolean;
  /**
   * Params as passed to the matcher, but with deprecated params mapped to their substitute,
   * or `undefined` if the match is not successful.
   */
  params: Map<string, any> | undefined;
  /**
   * Required params that are missing.
   */
  missingParams: ParamDefinition[];
  /**
   * Params that are not expected.
   */
  unexpectedParams: string[];
  /**
   * Params that are deprecated.
   */
  deprecatedParams: ParamDefinition[];
}
