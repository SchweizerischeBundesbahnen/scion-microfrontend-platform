/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { matchesCapabilityParams } from './params-tester';

describe('ParamsTester', () => {
  describe('function \'matchesCapabilityParams(...)\'', () => {

    it('should match if intent params and/or capability params are undefined or empty', () => {
      expect(matchesCapabilityParams(undefined))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(null))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(new Map()))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(undefined, {requiredCapabilityParams: [], optionalCapabilityParams: []}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(null, {requiredCapabilityParams: [], optionalCapabilityParams: []}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(new Map(), {requiredCapabilityParams: [], optionalCapabilityParams: []}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});
    });

    it('should match if intent contains all required and optional params', () => {
      expect(matchesCapabilityParams(new Map(), {requiredCapabilityParams: [], optionalCapabilityParams: []}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: ['param'], optionalCapabilityParams: []}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: [], optionalCapabilityParams: ['param']}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});
    });

    it('should match if param value is `null`', () => {
      expect(matchesCapabilityParams(new Map().set('param', null), {requiredCapabilityParams: ['param'], optionalCapabilityParams: []}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});

      expect(matchesCapabilityParams(new Map().set('param', null), {requiredCapabilityParams: [], optionalCapabilityParams: ['param']}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});
    });

    it('should not match if required param value is `undefined`', () => {
      expect(matchesCapabilityParams(new Map().set('param', undefined), {requiredCapabilityParams: ['param'], optionalCapabilityParams: []}))
        .toEqual({matches: false, missingParams: ['param'], unexpectedParams: []});
    });

    it('should match if optional param value is `undefined`', () => {
      expect(matchesCapabilityParams(new Map().set('param', undefined), {requiredCapabilityParams: [], optionalCapabilityParams: ['param']}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});
    });

    it('should match if intent is missing some optional params', () => {
      expect(matchesCapabilityParams(new Map().set('param1', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']}))
        .toEqual({matches: true, missingParams: [], unexpectedParams: []});
    });

    it('should not match if intent is missing some required params', () => {
      expect(matchesCapabilityParams(new Map().set('param2', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']}))
        .toEqual({matches: false, missingParams: ['param1'], unexpectedParams: []});
    });

    it('should not match if intent contains additional params', () => {
      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: [], optionalCapabilityParams: []}))
        .toEqual({matches: false, missingParams: [], unexpectedParams: ['param']});

      expect(matchesCapabilityParams(new Map().set('param1', 'value').set('param2', 'value').set('param3', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']}))
        .toEqual({matches: false, missingParams: [], unexpectedParams: ['param3']});
    });

    it('should not match if intent is missing some required params and contains additional params', () => {
      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: ['param1', 'param2'], optionalCapabilityParams: ['param3', 'param4']}))
        .toEqual({matches: false, missingParams: ['param1', 'param2'], unexpectedParams: ['param']});

      expect(matchesCapabilityParams(new Map().set('param1', 'value').set('param2', 'value').set('param3', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']}))
        .toEqual({matches: false, missingParams: [], unexpectedParams: ['param3']});
    });
  });
});
