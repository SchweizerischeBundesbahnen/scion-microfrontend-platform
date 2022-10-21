/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Handler, IntentInterceptor} from './message-interception';
import {Intent, IntentMessage, MessageHeaders} from '../../messaging.model';
import {ParamMatcher, ParamsMatcherResult} from './param-matcher';
import {Beans} from '@scion/toolkit/bean-manager';
import {Logger, LoggingContext} from '../../logger';
import {ParamDefinition} from '../../platform.model';

/**
 * Rejects an intent if passing invalid params and warns if passing deprecated params.
 *
 * @ignore
 */
export class IntentParamValidator implements IntentInterceptor {

  public async intercept(intentMessage: IntentMessage, next: Handler<IntentMessage>): Promise<void> {
    const capability = intentMessage.capability;
    const sender = intentMessage.headers.get(MessageHeaders.AppSymbolicName);

    // Remove params with `undefined` as value.
    intentMessage.intent.params?.forEach((value, key) => {
      if (value === undefined) {
        intentMessage.intent.params!.delete(key);
      }
    });

    // Test params passed with the intent to match expected params as declared on the capability.
    const paramMatcherResult = new ParamMatcher(capability.params!).match(intentMessage.intent.params);
    if (!paramMatcherResult.matches) {
      const error = toParamValidationError(paramMatcherResult, intentMessage.intent);
      return Promise.reject(Error(`[IntentParamValidationError] ${error}`));
    }

    // Warn about the usage of deprecated params.
    if (paramMatcherResult.deprecatedParams.length) {
      paramMatcherResult.deprecatedParams.forEach(deprecatedParam => {
        const warning = toDeprecatedParamWarning(deprecatedParam, {appSymbolicName: sender});
        Beans.get(Logger).warn(`[DEPRECATION][4EAC5956] ${warning}`, new LoggingContext(sender), intentMessage.intent);
      });
      // Use the matcher's parameters to have deprecated params mapped to their replacement.
      intentMessage.intent.params = paramMatcherResult.params!;
    }
    return next.handle(intentMessage);
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
