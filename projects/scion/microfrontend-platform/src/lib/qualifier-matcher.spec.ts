/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { assertExactQualifier, QualifierMatcher } from './qualifier-matcher';

describe('QualifierTester', () => {

  describe('should match a pattern containing the asterisk wildcard (*)', () => {

    it('flags: evalOptional: true, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '*'}, {evalOptional: true, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
    });

    it('flags: evalOptional: true, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '*'}, {evalOptional: true, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '*'}, {evalOptional: false, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '*'}, {evalOptional: false, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });
  });

  describe('should match a pattern containing the asterisk wildcard (*) and the any-more wildcard (**)', () => {

    it('flags: evalOptional: true, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '*', '*': '*'}, {evalOptional: true, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: true, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '*', '*': '*'}, {evalOptional: true, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '*', '*': '*'}, {evalOptional: false, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '*', '*': '*'}, {evalOptional: false, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });
  });

  describe('should match a pattern containing the optional wildcard (?)', () => {

    it('flags: evalOptional: true, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '?'}, {evalOptional: true, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeTrue();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: true, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '?'}, {evalOptional: true, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeTrue();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '?'}, {evalOptional: false, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({entity: 'person', id: '?'}, {evalOptional: false, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });
  });

  describe('should match a pattern containing the optional wildcard (?) and the any-more wildcard (**)', () => {

    it('flags: evalOptional: true, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '?', '*': '*'}, {evalOptional: true, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeTrue();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: true, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '?', '*': '*'}, {evalOptional: true, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeTrue();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: true', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '?', '*': '*'}, {evalOptional: false, evalAsterisk: true});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });

    it('flags: evalOptional: false, evalAsterisk: false', async () => {
      const matcher = new QualifierMatcher({'entity': 'person', 'id': '?', '*': '*'}, {evalOptional: false, evalAsterisk: false});

      expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
      expect(matcher.matches({entity: 'person'})).toBeFalse();
      expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
      expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
      expect(matcher.matches({})).toBeFalse();
      expect(matcher.matches(null)).toBeFalse();
      expect(matcher.matches(undefined)).toBeFalse();
    });
  });

  it('should match if the pattern is empty', async () => {
    const matcher = new QualifierMatcher({}, {evalOptional: true, evalAsterisk: true});

    expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is `undefined`', async () => {
    const matcher = new QualifierMatcher(undefined, {evalOptional: true, evalAsterisk: true});

    expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is `null`', async () => {
    const matcher = new QualifierMatcher(null, {evalOptional: true, evalAsterisk: true});

    expect(matcher.matches({entity: 'person', id: '5'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is empty and contains the any-more wildcard (**)', async () => {
    const matcher = new QualifierMatcher({'*': '*'}, {evalOptional: true, evalAsterisk: true});

    expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '*'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '?'})).toBeTrue();
    expect(matcher.matches({entity: 'person'})).toBeTrue();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeTrue();
    expect(matcher.matches({})).toBeTrue();
    expect(matcher.matches(null)).toBeTrue();
    expect(matcher.matches(undefined)).toBeTrue();
  });

  it('should match if the pattern is exact', () => {
    const matcher = new QualifierMatcher({entity: 'person', id: '5'}, {evalOptional: true, evalAsterisk: true});

    expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeFalse();
    expect(matcher.matches(null)).toBeFalse();
    expect(matcher.matches(undefined)).toBeFalse();
  });

  it('should match if the pattern is exact and contains the any-more wildcard (**)', () => {
    const matcher = new QualifierMatcher({'entity': 'person', 'id': '5', '*': '*'}, {evalOptional: true, evalAsterisk: true});

    expect(matcher.matches({entity: 'person', id: '5'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '*'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?'})).toBeFalse();
    expect(matcher.matches({entity: 'person'})).toBeFalse();
    expect(matcher.matches({entity: 'person', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '5', other: 'property'})).toBeTrue();
    expect(matcher.matches({entity: 'person', id: '*', other: 'property'})).toBeFalse();
    expect(matcher.matches({entity: 'person', id: '?', other: 'property'})).toBeFalse();
    expect(matcher.matches({})).toBeFalse();
    expect(matcher.matches(null)).toBeFalse();
    expect(matcher.matches(undefined)).toBeFalse();
  });

  it('should throw if the qualifier is not exact', () => {
    expect(() => assertExactQualifier({entity: 'person', id: '5'})).not.toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person', id: '*'})).toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person', id: '?'})).toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person'})).not.toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person', other: 'property'})).not.toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person', id: '5', other: 'property'})).not.toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person', id: '*', other: 'property'})).toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({entity: 'person', id: '?', other: 'property'})).toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier({})).not.toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier(null)).not.toThrowError(/IllegalQualifierError/);
    expect(() => assertExactQualifier(undefined)).not.toThrowError(/IllegalQualifierError/);
  });
});
