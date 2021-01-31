/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Tests if the given intent params match the required and optional parameters of a capability.
 *
 * The intent params must not contain additional parameters.
 *
 * @param intentParams - params to test against optional and required params of a capability.
 * @param options - required and optional parameters declared in the capability.
 *
 * @ignore
 */
export function matchesCapabilityParams(intentParams: Map<string, any>, options?: { requiredCapabilityParams?: string[], optionalCapabilityParams?: string[] }): ParamsMatcherResult {
  const requiredCapabilityParams = options?.requiredCapabilityParams || [];
  const optionalCapabilityParams = options?.optionalCapabilityParams || [];
  intentParams = intentParams || new Map<string, any>();

  const matcherResult: ParamsMatcherResult = {
    matches: true,
    missingParams: [],
    unexpectedParams: [],
  };

  // Test if the intent contains all required params.
  requiredCapabilityParams
    .filter(requiredParam => intentParams.get(requiredParam) === undefined)
    .forEach(requiredParam => {
      matcherResult.matches = false;
      matcherResult.missingParams.push(requiredParam);
    });

  // Test if the intent contains any additional params.
  Array.from(intentParams.keys())
    .filter(intentParam => !requiredCapabilityParams.includes(intentParam) && !optionalCapabilityParams.includes(intentParam))
    .forEach(intentParam => {
      matcherResult.matches = false;
      matcherResult.unexpectedParams.push(intentParam);
    });

  return matcherResult;
}

/**
 * Represents the result of a params matcher test.
 */
export interface ParamsMatcherResult {
  /**
   * Indicates whether the intent params match the capability's params.
   */
  matches: boolean;
  /**
   * Params that are missing in the intent params.
   */
  missingParams?: string[];
  /**
   * Intent params that are neither required nor optional.
   */
  unexpectedParams: string[];
}
