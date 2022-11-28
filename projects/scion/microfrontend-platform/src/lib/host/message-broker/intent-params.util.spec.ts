/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {IntentParams} from './intent-params.util';
import {IntentMessage, MessageHeaders} from '../../messaging.model';
import {getLoggerSpy, installLoggerSpies} from '../../testing/spec.util.spec';
import {Beans} from '@scion/toolkit/bean-manager';

describe('IntentParams', () => {

  beforeEach(async () => {
    await Beans.destroy();
    installLoggerSpies();
  });

  afterEach(async () => {
    await Beans.destroy();
  });

  it('should validate intent with params', () => {
    const intentMessage: IntentMessage = {
      capability: {
        type: 'test',
        params: [
          {name: 'requiredParam', required: true},
          {name: 'optionalParam', required: false},
        ],
      },
      intent: {
        type: 'test', params: new Map()
          .set('requiredParam', 'requiredParamValue')
          .set('optionalParam', 'optionalParamValue'),
      },
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map()
      .set('requiredParam', 'requiredParamValue')
      .set('optionalParam', 'optionalParamValue'),
    );
  });

  it('should validate intent without params', () => {
    const intentMessage: IntentMessage = {
      capability: {type: 'test'},
      intent: {type: 'test'},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map());
  });

  it('should remove `undefined` params', () => {
    const intentMessage: IntentMessage = {
      capability: {type: 'test'},
      intent: {type: 'test', params: new Map().set('param', undefined)},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map());
  });

  it('should error if the intent contains additional params', () => {
    const intentMessage: IntentMessage = {
      capability: {type: 'test'},
      intent: {type: 'test', params: new Map().set('param', 'value')},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    expect(() => IntentParams.validateParams(intentMessage)).toThrowError(/IntentParamValidationError/);
  });

  it('should error if the intent is missing required params', () => {
    const intentMessage: IntentMessage = {
      capability: {
        type: 'test',
        params: [{name: 'param', required: true}],
      },
      intent: {type: 'test'},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    expect(() => IntentParams.validateParams(intentMessage)).toThrowError(/IntentParamValidationError/);
  });

  it('should not error if the intent is missing optional params', () => {
    const intentMessage: IntentMessage = {
      capability: {
        type: 'test',
        params: [{name: 'param', required: false}],
      },
      intent: {type: 'test'},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map());
  });

  it('should warn if passing deprecated params', () => {
    const intentMessage: IntentMessage = {
      capability: {
        type: 'test',
        params: [{name: 'param', required: true, deprecated: true}],
      },
      intent: {type: 'test', params: new Map().set('param', 'value')},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map().set('param', 'value'));
    expect(getLoggerSpy('warn')).toHaveBeenCalledWith(jasmine.stringMatching(/\[DEPRECATION]\[4EAC5956] Application 'app' passes a deprecated parameter in the intent: 'param'/), jasmine.anything(), jasmine.anything());
  });

  it('should map deprecated params and log a warning', () => {
    const intentMessage: IntentMessage = {
      capability: {
        type: 'test',
        params: [
          {name: 'param1', required: true, deprecated: {useInstead: 'param2'}},
          {name: 'param2', required: true},
        ],
      },
      intent: {type: 'test', params: new Map().set('param1', 'value')},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map().set('param2', 'value'));
    expect(getLoggerSpy('warn')).toHaveBeenCalledWith(jasmine.stringMatching(/\[DEPRECATION]\[4EAC5956] Application 'app' passes a deprecated parameter in the intent: 'param1'\. Pass parameter 'param2' instead\./), jasmine.anything(), jasmine.anything());
  });

  it('should not log a warning if not passing deprecated params', () => {
    const intentMessage: IntentMessage = {
      capability: {
        type: 'test',
        params: [
          {name: 'param1', required: true, deprecated: {useInstead: 'param2'}},
          {name: 'param2', required: true},
        ],
      },
      intent: {type: 'test', params: new Map().set('param2', 'value')},
      headers: new Map().set(MessageHeaders.AppSymbolicName, 'app'),
    };

    IntentParams.validateParams(intentMessage);
    expect(intentMessage.intent.params).toEqual(new Map().set('param2', 'value'));
    expect(getLoggerSpy('warn')).not.toHaveBeenCalledWith();
  });
});
