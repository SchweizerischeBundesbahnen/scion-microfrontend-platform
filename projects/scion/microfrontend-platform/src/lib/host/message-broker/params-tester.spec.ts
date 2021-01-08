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
      expect(matchesCapabilityParams(undefined)).toBeTrue();
      expect(matchesCapabilityParams(null)).toBeTrue();
      expect(matchesCapabilityParams(new Map())).toBeTrue();
      expect(matchesCapabilityParams(undefined, {requiredCapabilityParams: [], optionalCapabilityParams: []})).toBeTrue();
      expect(matchesCapabilityParams(null, {requiredCapabilityParams: [], optionalCapabilityParams: []})).toBeTrue();
      expect(matchesCapabilityParams(new Map(), {requiredCapabilityParams: [], optionalCapabilityParams: []})).toBeTrue();
    });

    it('should match if intent contains all required and optional params', () => {
      expect(matchesCapabilityParams(new Map(), {requiredCapabilityParams: [], optionalCapabilityParams: []})).toBeTrue();
      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: ['param'], optionalCapabilityParams: []})).toBeTrue();
      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: [], optionalCapabilityParams: ['param']})).toBeTrue();
    });

    it('should match if param value is `null`', () => {
      expect(matchesCapabilityParams(new Map().set('param', null), {requiredCapabilityParams: ['param'], optionalCapabilityParams: []})).toBeTrue();
      expect(matchesCapabilityParams(new Map().set('param', null), {requiredCapabilityParams: [], optionalCapabilityParams: ['param']})).toBeTrue();
    });

    it('should not match if required param value is `undefined`', () => {
      expect(matchesCapabilityParams(new Map().set('param', undefined), {requiredCapabilityParams: ['param'], optionalCapabilityParams: []})).toBeFalse();
    });

    it('should match if optional param value is `undefined`', () => {
      expect(matchesCapabilityParams(new Map().set('param', undefined), {requiredCapabilityParams: [], optionalCapabilityParams: ['param']})).toBeTrue();
    });

    it('should match if intent is missing some optional params', () => {
      expect(matchesCapabilityParams(new Map().set('param1', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']})).toBeTrue();
    });

    it('should not match if intent is missing some required params', () => {
      expect(matchesCapabilityParams(new Map().set('param2', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']})).toBeFalse();
    });

    it('should not match if intent contains additional params', () => {
      expect(matchesCapabilityParams(new Map().set('param', 'value'), {requiredCapabilityParams: [], optionalCapabilityParams: []})).toBeFalse();
      expect(matchesCapabilityParams(new Map().set('param1', 'value').set('param2', 'value').set('param3', 'value'), {requiredCapabilityParams: ['param1'], optionalCapabilityParams: ['param2']})).toBeFalse();
    });
  });
});
