/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {QualifierMatcher} from './qualifier-matcher';

describe('QualifierTester', () => {

  it('should match a pattern containing the asterisk wildcard (*)', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeTrue();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeFalse();
  });

  it('should match a pattern containing the asterisk wildcard (*) and the any-more wildcard (**)', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: '*', '*': '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeTrue();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeTrue();
    expect(matcher.matches({})).toBeFalse();
    expect(matcher.matches(null)).toBeFalse();
    expect(matcher.matches(undefined)).toBeFalse();
  });

  it('should match if the pattern is empty', async () => {
    const matcher = new QualifierMatcher({});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is `undefined`', async () => {
    const matcher = new QualifierMatcher(undefined);

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is `null`', async () => {
    const matcher = new QualifierMatcher(null);

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is empty and contains the any-more wildcard (**)', async () => {
    const matcher = new QualifierMatcher({'*': '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeTrue();
    expect(matcher.matches({entity: 'person'})).toBeTrue();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeTrue();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is exact', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: 'new'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeFalse();
    expect(matcher.matches(null)).toBeFalse();
    expect(matcher.matches(undefined)).toBeFalse();
  });

  it('should match if the pattern is exact and contains the any-more wildcard (**)', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: 'new', '*': '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeFalse();
    expect(matcher.matches(null)).toBeFalse();
    expect(matcher.matches(undefined)).toBeFalse();
  });
});
