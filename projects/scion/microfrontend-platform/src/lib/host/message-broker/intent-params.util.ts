/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Intent, IntentMessage, MessageHeaders} from '../../messaging.model';
import {ParamMatcher, ParamsMatcherResult} from './param-matcher';
import {Beans} from '@scion/toolkit/bean-manager';
import {Logger, LoggingContext} from '../../logger';
import {ParamDefinition} from '../../platform.model';

/**
 * Provides utilities for working with intent params.
 *
 * NOTE: Use static class instead of namespace to be tree shakable, i.e., to not be included in client app.
 *
 * @internal
 */
export class IntentParams {

  private constructor() {
  }

  /**
   * Validates params of given intent.
   *
   * @throws if the message contains invalid params.
   */
  public static validateParams(intentMessage: IntentMessage): void {
    const {intent, capability} = intentMessage;
    const sender = intentMessage.headers.get(MessageHeaders.AppSymbolicName);
    intent.params = new Map(intent.params);

    // Remove params with `undefined` as value.
    intent.params.forEach((value, key) => {
      if (value === undefined) {
        intent.params!.delete(key);
      }
    });

    // Test params passed with the intent to match expected params as declared on the capability.
    const paramMatcherResult = new ParamMatcher(capability.params || []).match(intent.params);
    if (!paramMatcherResult.matches) {
      const error = toParamValidationError(paramMatcherResult, intent);
      throw Error(`[IntentParamValidationError] ${error}`);
    }

    // Warn about the usage of deprecated params.
    if (paramMatcherResult.deprecatedParams.length) {
      paramMatcherResult.deprecatedParams.forEach(deprecatedParam => {
        const warning = toDeprecatedParamWarning(deprecatedParam, {appSymbolicName: sender});
        Beans.get(Logger).warn(`[DEPRECATION][4EAC5956] ${warning}`, new LoggingContext(sender), intent);
      });
      // Use the matcher's parameters to have deprecated params mapped to their replacement.
      intent.params = paramMatcherResult.params;
    }
  }
}

function toParamValidationError(paramsMatcherResult: ParamsMatcherResult, intent: Intent): string {
  const intentStringified = JSON.stringify(intent, (key, value) => (key === 'params') ? undefined : value);
  const missingParams = paramsMatcherResult.missingParams.map(param => param.name);
  const unexpectedParams = paramsMatcherResult.unexpectedParams;
  return `Params of intent do not match expected params of capability. The intent must have required params and not have additional params. [intent=${intentStringified}, missingParams=[${missingParams}], unexpectedParams=[${unexpectedParams}]].`;
}

function toDeprecatedParamWarning(param: ParamDefinition, metadata: {appSymbolicName: string}): string {
  const deprecation = param.deprecated!;
  const useInstead = typeof deprecation === 'object' && deprecation.useInstead || undefined;
  const message = typeof deprecation === 'object' && deprecation.message || undefined;

  return new Array<string>()
    .concat(`Application '${metadata.appSymbolicName}' passes a deprecated parameter in the intent: '${param.name}'.`)
    .concat(useInstead ? `Pass parameter '${useInstead}' instead.` : [])
    .concat(message || [])
    .join(' ');
}
