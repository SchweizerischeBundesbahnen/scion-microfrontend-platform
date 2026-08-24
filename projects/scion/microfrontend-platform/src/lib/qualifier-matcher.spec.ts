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

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(true);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(false);
    expect(matcher.matches({})).toBe(false);
  });

  it('should match a pattern containing the asterisk wildcard (*) and the any-more wildcard (**)', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: '*', '*': '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(true);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(true);
    expect(matcher.matches({})).toBe(false);
    expect(matcher.matches(null)).toBe(false);
    expect(matcher.matches(undefined)).toBe(false);
  });

  it('should match if the pattern is empty', async () => {
    const matcher = new QualifierMatcher({});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(false);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(false);
    expect(matcher.matches({})).toBe(true);
    expect(matcher.matches(null)).toBe(true);
    expect(matcher.matches(undefined)).toBe(true);
  });

  it('should match if the pattern is `undefined`', async () => {
    const matcher = new QualifierMatcher(undefined);

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(false);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(false);
    expect(matcher.matches({})).toBe(true);
    expect(matcher.matches(null)).toBe(true);
    expect(matcher.matches(undefined)).toBe(true);
  });

  it('should match if the pattern is `null`', async () => {
    const matcher = new QualifierMatcher(null);

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(false);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(false);
    expect(matcher.matches({})).toBe(true);
    expect(matcher.matches(null)).toBe(true);
    expect(matcher.matches(undefined)).toBe(true);
  });

  it('should match if the pattern is empty and contains the any-more wildcard (**)', async () => {
    const matcher = new QualifierMatcher({'*': '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(true);
    expect(matcher.matches({entity: 'person'})).toBe(true);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(true);
    expect(matcher.matches({})).toBe(true);
    expect(matcher.matches(null)).toBe(true);
    expect(matcher.matches(undefined)).toBe(true);
  });

  it('should match if the pattern is exact', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: 'new'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(false);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(false);
    expect(matcher.matches({})).toBe(false);
    expect(matcher.matches(null)).toBe(false);
    expect(matcher.matches(undefined)).toBe(false);
  });

  it('should match if the pattern is exact and contains the any-more wildcard (**)', () => {
    const matcher = new QualifierMatcher({entity: 'person', mode: 'new', '*': '*'});

    expect(matcher.matches({entity: 'person', mode: 'new'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*'})).toBe(false);
    expect(matcher.matches({entity: 'person'})).toBe(false);
    expect(matcher.matches({entity: 'person', other: 'property'})).toBe(false);
    expect(matcher.matches({entity: 'person', mode: 'new', other: 'property'})).toBe(true);
    expect(matcher.matches({entity: 'person', mode: '*', other: 'property'})).toBe(false);
    expect(matcher.matches({})).toBe(false);
    expect(matcher.matches(null)).toBe(false);
    expect(matcher.matches(undefined)).toBe(false);
  });
});
