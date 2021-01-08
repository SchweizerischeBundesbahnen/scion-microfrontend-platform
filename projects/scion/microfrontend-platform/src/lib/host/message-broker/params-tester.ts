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
export function matchesCapabilityParams(intentParams: Map<string, any>, options?: {requiredCapabilityParams?: string[], optionalCapabilityParams?: string[]}): boolean {
  const requiredCapabilityParams = options?.requiredCapabilityParams || [];
  const optionalCapabilityParams = options?.optionalCapabilityParams || [];
  intentParams = intentParams || new Map<string, any>();

  // Test if intent contains all required parameters
  if (requiredCapabilityParams.some(requiredParam => intentParams.get(requiredParam) === undefined)) {
    return false;
  }

  // Test if intent contains no additional parameters
  return Array.from(intentParams.keys()).every(intentParam => requiredCapabilityParams.includes(intentParam) || optionalCapabilityParams.includes(intentParam));
}
