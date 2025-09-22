/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ParamMatcher} from './param-matcher';

describe('ParamMatcher', () => {

  it('should match if passing params as expected', () => {
    expect(new ParamMatcher([])
      .match(new Map()))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});

    expect(new ParamMatcher([])
      .match(undefined))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});

    expect(new ParamMatcher([])
      .match(null))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});

    expect(new ParamMatcher([{name: 'param', required: true}])
      .match(new Map().set('param', 'value')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map().set('param', 'value')});

    expect(new ParamMatcher([{name: 'param', required: false}])
      .match(new Map().set('param', 'value')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map().set('param', 'value')});

    expect(new ParamMatcher([{name: 'param', required: false}])
      .match(new Map()))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});

    expect(new ParamMatcher([{name: 'param', required: false}])
      .match(null))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});

    expect(new ParamMatcher([{name: 'param', required: false}])
      .match(undefined))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});

    expect(new ParamMatcher([{name: 'param1', required: true}, {name: 'param2', required: false}])
      .match(new Map().set('param1', 'value1').set('param2', 'value2')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map().set('param1', 'value1').set('param2', 'value2')});

    expect(new ParamMatcher([{name: 'param1', required: true}, {name: 'param2', required: false}])
      .match(new Map().set('param1', 'value1')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map().set('param1', 'value1')});
  });

  it('should not match if not passing required params', () => {
    expect(new ParamMatcher([{name: 'param', required: true}])
      .match(new Map()))
      .toEqual({matches: false, missingParams: [{name: 'param', required: true}], unexpectedParams: [], deprecatedParams: [], params: undefined});

    expect(new ParamMatcher([{name: 'param1', required: true}, {name: 'param2', required: true}])
      .match(new Map().set('param1', 'value1')))
      .toEqual({matches: false, missingParams: [{name: 'param2', required: true}], unexpectedParams: [], deprecatedParams: [], params: undefined});
  });

  it('should handle \'null\' as valid required param value', () => {
    expect(new ParamMatcher([{name: 'param', required: true}])
      .match(new Map().set('param', null)))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map().set('param', null)});
  });

  it('should not handle \'undefined\' as valid required param value', () => {
    expect(new ParamMatcher([{name: 'param', required: true}])
      .match(new Map().set('param', undefined)))
      .toEqual({matches: false, missingParams: [{name: 'param', required: true}], unexpectedParams: [], deprecatedParams: [], params: undefined});
  });

  it('should not match if passing unexpected params', () => {
    expect(new ParamMatcher([{name: 'param1', required: true}, {name: 'param2', required: true}])
      .match(new Map().set('param1', 'value1').set('param2', 'value2').set('param3', 'value3')))
      .toEqual({matches: false, missingParams: [], unexpectedParams: ['param3'], deprecatedParams: [], params: undefined});

    expect(new ParamMatcher([{name: 'param1', required: true}, {name: 'param2', required: true}])
      .match(new Map().set('param1', 'value1').set('param3', 'value3')))
      .toEqual({matches: false, missingParams: [{name: 'param2', required: true}], unexpectedParams: ['param3'], deprecatedParams: [], params: undefined});
  });

  it('should detect deprecated params', () => {
    expect(new ParamMatcher([{name: 'param', required: false, deprecated: true}])
      .match(new Map().set('param', 'value')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param', required: false, deprecated: true}], params: new Map().set('param', 'value')});

    expect(new ParamMatcher([{name: 'param', required: false, deprecated: {message: 'deprecation notice'}}])
      .match(new Map().set('param', 'value')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param', required: false, deprecated: {message: 'deprecation notice'}}], params: new Map().set('param', 'value')});

    expect(new ParamMatcher([{name: 'param', required: true, deprecated: true}])
      .match(new Map().set('param', null)))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param', required: true, deprecated: true}], params: new Map().set('param', null)});
  });

  it('should treat deprecated params as optional params', () => {
    expect(new ParamMatcher([{name: 'param', deprecated: true, required: true}])
      .match(new Map().set('param', 'value')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param', deprecated: true, required: true}], params: new Map().set('param', 'value')});

    expect(new ParamMatcher([{name: 'param', deprecated: true, required: true}])
      .match(new Map().set('param', undefined)))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param', deprecated: true, required: true}], params: new Map().set('param', undefined)});

    expect(new ParamMatcher([{name: 'param', deprecated: true, required: true}])
      .match(new Map()))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [], params: new Map()});
  });

  it('should map deprecated params to their substitute, if any', () => {
    expect(new ParamMatcher([{name: 'param1', required: true, deprecated: {useInstead: 'param2'}}, {name: 'param2', required: true}])
      .match(new Map().set('param1', 'value1')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param1', required: true, deprecated: {useInstead: 'param2'}}], params: new Map().set('param2', 'value1')});

    expect(new ParamMatcher([{name: 'param1', required: true, deprecated: {useInstead: 'param2', message: 'deprecation notice'}}, {name: 'param2', required: true}])
      .match(new Map().set('param1', 'value1')))
      .toEqual({matches: true, missingParams: [], unexpectedParams: [], deprecatedParams: [{name: 'param1', required: true, deprecated: {useInstead: 'param2', message: 'deprecation notice'}}], params: new Map().set('param2', 'value1')});

    expect(new ParamMatcher([{name: 'param1', required: true, deprecated: {useInstead: 'param2'}}])
      .match(new Map().set('param1', 'value1')))
      .toEqual({matches: false, missingParams: [], unexpectedParams: ['param2'], deprecatedParams: [{name: 'param1', required: true, deprecated: {useInstead: 'param2'}}], params: undefined});
  });
});
