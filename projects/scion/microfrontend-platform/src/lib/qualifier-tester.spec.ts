/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { isEqualQualifier, matchesIntentQualifier, matchesWildcardQualifier } from './qualifier-tester';
import { Qualifier } from './platform.model';

describe('QualifierTester', () => {

  describe('function \'isEqualQualifier(...)\'', () => {

    it('equals same qualifiers', () => {
      const qualifier = {'entity': 'person', 'id': 42};
      expect(isEqualQualifier(qualifier, qualifier)).toBeTrue();
    });

    it('equals if all keys and values match', () => {
      expect(isEqualQualifier(null, null)).toBeTrue();
      expect(isEqualQualifier(undefined, undefined)).toBeTrue();
      expect(isEqualQualifier({}, {})).toBeTrue();
      expect(isEqualQualifier({'entity': 'person', 'id': 42}, {'entity': 'person', 'id': 42})).toBeTrue();
      expect(isEqualQualifier({'entity': '*', 'id': 42}, {'entity': '*', 'id': 42})).toBeTrue();
      expect(isEqualQualifier({'entity': '?', 'id': 42}, {'entity': '?', 'id': 42})).toBeTrue();
      expect(isEqualQualifier({'*': '*'}, {'*': '*'})).toBeTrue();
    });

    it('is not equal if having different qualifier keys', () => {
      expect(isEqualQualifier({'entity': 'person'}, {'entity': 'person', 'id': 42})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person', 'id': 42}, {'entity': 'person'})).toBeFalse();
    });

    it('is not equal if having different qualifier values', () => {
      expect(isEqualQualifier({'entity': 'person', 'id': 42}, {'entity': 'person', 'id': 43})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person', 'id': 43}, {'entity': 'person', 'id': 42})).toBeFalse();
      expect(isEqualQualifier({'entity': 'test', 'id': 42}, {'entity': 'person', 'id': 42})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person', 'id': 42}, {'entity': 'test', 'id': 42})).toBeFalse();
    });

    it('is not equal if comparing wildcard qualifier with specific qualifier', () => {
      expect(isEqualQualifier({'*': '*'}, {'entity': 'person'})).toBeFalse();
      expect(isEqualQualifier({'entity': '*'}, {'entity': 'person'})).toBeFalse();
      expect(isEqualQualifier({'entity': '?'}, {'entity': 'person'})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person'}, {'*': '*'})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person'}, {'entity': '*'})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person'}, {'entity': '?'})).toBeFalse();
    });

    it('is not equal if comparing empty qualifier with non-empty qualifier', () => {
      expect(isEqualQualifier(null, {'entity': 'person'})).toBeFalse();
      expect(isEqualQualifier(undefined, {'entity': 'person'})).toBeFalse();
      expect(isEqualQualifier({}, {'entity': 'person'})).toBeFalse();
      expect(isEqualQualifier({'entity': 'person'}, null)).toBeFalse();
      expect(isEqualQualifier({'entity': 'person'}, undefined)).toBeFalse();
      expect(isEqualQualifier({'entity': 'person'}, {})).toBeFalse();
    });
  });

  describe('function \'matchesIntentQualifier(...)\'', () => {
    describe('check against empty qualifier', () => {
      const UndefinedQualifier = undefined;
      const NullQualifier = null;
      const EmptyQualifier = {};

      it('should match empty qualifiers', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, undefined)).toBeTrue();
        expect(matchesIntentQualifier(UndefinedQualifier, null)).toBeTrue();
        expect(matchesIntentQualifier(UndefinedQualifier, {})).toBeTrue();
        expect(matchesIntentQualifier(NullQualifier, undefined)).toBeTrue();
        expect(matchesIntentQualifier(NullQualifier, null)).toBeTrue();
        expect(matchesIntentQualifier(NullQualifier, {})).toBeTrue();
        expect(matchesIntentQualifier(EmptyQualifier, undefined)).toBeTrue();
        expect(matchesIntentQualifier(EmptyQualifier, null)).toBeTrue();
        expect(matchesIntentQualifier(EmptyQualifier, {})).toBeTrue();
      });

      it('should not match `AnyQualifier`', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'*': '*'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'*': '*'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'*': '*'})).toBeFalse();
      });

      it('should not match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'*': '*', 'entity': '?'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'*': '*', 'entity': '?'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'*': '*', 'entity': '?'})).toBeFalse();
      });

      it('should not match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
      });

      it('should not match `AnyQualifier` with additional specific qualifier value', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
      });

      it('should not match qualifier containing wildcard (?) value', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'entity': '?'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'entity': '?'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'entity': '?'})).toBeFalse();

        expect(matchesIntentQualifier(UndefinedQualifier, {'entity': '?', 'id': '?'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'entity': '?', 'id': '?'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'entity': '?', 'id': '?'})).toBeFalse();
      });

      it('should not match qualifier containing wildcard (*) value', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'entity': '*'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'entity': '*'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'entity': '*'})).toBeFalse();

        expect(matchesIntentQualifier(UndefinedQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
      });

      it('should not match qualifier containing specific value', () => {
        expect(matchesIntentQualifier(UndefinedQualifier, {'entity': 'person'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'entity': 'person'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'entity': 'person'})).toBeFalse();

        expect(matchesIntentQualifier(UndefinedQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        expect(matchesIntentQualifier(NullQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        expect(matchesIntentQualifier(EmptyQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
      });
    });

    describe('check against qualifier containing specific qualifier value', () => {
      describe('qualifier containing boolean value', () => {
        it('tests strict equality for `true`', () => {
          const BooleanQualifier = {flag: true};
          expect(matchesIntentQualifier(BooleanQualifier, {flag: true})).toBeTrue();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: false})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: null})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: undefined})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 0})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 1})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 'true'})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 'false'})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: ''})).toBeFalse();
        });

        it('tests strict equality for `false`', () => {
          const BooleanQualifier = {flag: false};
          expect(matchesIntentQualifier(BooleanQualifier, {flag: false})).toBeTrue();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: true})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: null})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: undefined})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 0})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 1})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 'true'})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: 'false'})).toBeFalse();
          expect(matchesIntentQualifier(BooleanQualifier, {flag: ''})).toBeFalse();
        });
      });

      describe('qualifier containing numeric value', () => {
        const NumericQualifier = {id: 1};

        it('tests strict equality', () => {
          expect(matchesIntentQualifier(NumericQualifier, {id: 1})).toBeTrue();
          expect(matchesIntentQualifier(NumericQualifier, {id: '1'})).toBeFalse();
          expect(matchesIntentQualifier(NumericQualifier, {id: 2})).toBeFalse();
          expect(matchesIntentQualifier(NumericQualifier, {id: undefined})).toBeFalse();
          expect(matchesIntentQualifier(NumericQualifier, {id: null})).toBeFalse();
          expect(matchesIntentQualifier(NumericQualifier, {id: true})).toBeFalse();
          expect(matchesIntentQualifier(NumericQualifier, {id: false})).toBeFalse();
          expect(matchesIntentQualifier(NumericQualifier, {id: ''})).toBeFalse();
        });
      });

      describe('qualifier containing single key', () => {
        const SpecificQualifier = {'entity': 'person'};

        it('should not match empty qualifiers', () => {
          expect(matchesIntentQualifier(SpecificQualifier, undefined)).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, null)).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {})).toBeFalse();
        });

        it('should not match `AnyQualifier`', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*', 'entity': '?'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional specific qualifier value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        });

        it('should match exact qualifier', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should not match qualifier containing specific value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'id': '1'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'id': '1'})).toBeFalse();
        });
      });

      describe('qualifier containing multiple keys', () => {
        const SpecificQualifier = {'entity': 'person', 'type': 'user'};

        it('should not match empty qualifiers', () => {
          expect(matchesIntentQualifier(SpecificQualifier, undefined)).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, null)).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {})).toBeFalse();
        });

        it('should not match `AnyQualifier`', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional specific qualifier values', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeFalse();
        });

        it('should match exact qualifier', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': 'user'})).toBeTrue();
        });

        it('should not match qualifier containing specific values and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific values and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
        });

        it('should not match qualifier missing a key', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {type: 'user'})).toBeFalse();
        });

        it('should not match qualifier containing different entity value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'x', 'type': 'user'})).toBeFalse();
        });

        it('should not match qualifier containing different type value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': 'x'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) values', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) values', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
        });

        it('should not match qualifier containing a combination of specific values and wildcard values', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '?'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': 'user'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': 'user'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '?'})).toBeFalse();
        });

        it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
          expect(matchesIntentQualifier(SpecificQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
        });
      });
    });

    describe('check against qualifier containing wildcard (*) qualifier value', () => {
      describe('qualifier containing single key', () => {
        const AsteriskQualifier = {'entity': '*'};

        it('should not match empty qualifiers', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, undefined)).toBeFalse();
          expect(matchesIntentQualifier(AsteriskQualifier, null)).toBeFalse();
          expect(matchesIntentQualifier(AsteriskQualifier, {})).toBeFalse();
        });

        it('should not match `AnyQualifier`', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*', 'entity': '?'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional specific qualifier value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        });

        it('should match exact qualifier (asterisk is interpreted as value, not as wildcard)', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should match qualifier containing specific value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should not match qualifier containing specific value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional specific value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing question mark (?) value (question mark is interpreted as value, not as wildcard)', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional specific value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing asterisk (*) value (asterisk is interpreted as value, not as wildcard)', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional specific value', () => {
          expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'id': '1'})).toBeFalse();
        });
      });

      describe('qualifier containing multiple keys', () => {
        describe('qualifier only contains wildcard (*) qualifier values', () => {
          const AsteriskQualifier = {'entity': '*', 'type': '*'};

          it('should not match empty qualifiers', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, undefined)).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, null)).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {})).toBeFalse();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional specific qualifier values', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeFalse();
          });

          it('should match exact qualifier (asterisks are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier missing a key', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {type: '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing asterisk (*) values (asterisks are interpreted as value, not as wildcard)', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and (* and ?) values (asterisk and question mark are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(AsteriskQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });

        describe('qualifier contains combination of wildcard (*) and specific qualifier values', () => {
          const CombinedQualifier = {'entity': '*', 'type': 'user'};

          it('should not match empty qualifiers', () => {
            expect(matchesIntentQualifier(CombinedQualifier, undefined)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, null)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {})).toBeFalse();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional specific qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeFalse();
          });

          it('should match exact qualifier (asterisk is interpreted as value, not as wildcard)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier missing a key', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {type: 'user'})).toBeFalse();
          });

          it('should not match qualifier containing different type value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'x'})).toBeFalse();
          });

          it('should not match qualifier containing question mark (?) values (type has to be `user`)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values (type has to be `user`)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of (* and ?) for entity and `user` for type', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing a (* and ?) for type', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });
      });
    });

    describe('check against qualifier containing wildcard (?) qualifier value', () => {
      describe('qualifier containing single key', () => {
        const OptionalQualifier = {'entity': '?'};

        it('should match empty qualifiers', () => {
          expect(matchesIntentQualifier(OptionalQualifier, undefined)).toBeTrue();
          expect(matchesIntentQualifier(OptionalQualifier, null)).toBeTrue();
          expect(matchesIntentQualifier(OptionalQualifier, {})).toBeTrue();
        });

        it('should not match `AnyQualifier`', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'*': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'*': '*', 'entity': '?'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        });

        it('should not match `AnyQualifier` with additional specific qualifier value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        });

        it('should match exact qualifier (question mark is interpreted as value, not as wildcard)', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing specific value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should not match qualifier containing specific value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional specific value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing question mark (?) value (question mark is interpreted as value, not as wildcard)', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional specific value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing asterisk (*) value (asterisk is interpreted as value, not as wildcard)', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (*) value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (?) value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'id': '?'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (*) value and additional specific value', () => {
          expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'id': '1'})).toBeFalse();
        });
      });

      describe('qualifier containing multiple keys', () => {
        describe('qualifier only contains wildcard (?) qualifier values', () => {
          const OptionalQualifier = {'entity': '?', 'type': '?'};

          it('should match empty qualifiers', () => {
            expect(matchesIntentQualifier(OptionalQualifier, undefined)).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, null)).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {})).toBeTrue();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'*': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional specific qualifier values', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeFalse();
          });

          it('should match exact qualifier (question marks are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier missing a key', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?'})).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {type: '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing asterisk (*) values (asterisks are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and (* and ?) values (interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(OptionalQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });

        describe('qualifier contains combination of wildcard (?) and wildcard (*) qualifier values', () => {
          const CombinedQualifier = {'entity': '?', 'type': '*'};

          it('should not match empty qualifiers', () => {
            expect(matchesIntentQualifier(CombinedQualifier, undefined)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, null)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {})).toBeFalse();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional specific qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeFalse();
          });

          it('should match exact qualifier (* and ? are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier missing optional key', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {type: '*'})).toBeTrue();
          });

          it('should not match qualifier missing mandatory key', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?'})).toBeFalse();
          });

          it('should match qualifier containing question mark (?) values (question marks are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values (asterisks are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and wildcard values (* and ? are interpreted as values, not as wildcards)', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });

        describe('qualifier contains combination of wildcard (?) and specific qualifier values', () => {
          const CombinedQualifier = {'entity': '?', 'type': 'user'};

          it('should not match empty qualifiers', () => {
            expect(matchesIntentQualifier(CombinedQualifier, undefined)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, null)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {})).toBeFalse();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match `AnyQualifier` with additional specific qualifier values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeFalse();
          });

          it('should match exact qualifier', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier missing optional key', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {type: 'user'})).toBeTrue();
          });

          it('should not match qualifier missing mandatory key', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?'})).toBeFalse();
          });

          it('should not match qualifier containing different type value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'x'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier containing a (* and ?) values for type', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeFalse();
          });

          it('should match qualifier containing a combination of (* and ?) values for entity and `user` for type', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });
      });
    });

    describe('check against `AnyQualifier`', () => {

      describe('qualifier containing single key', () => {
        const AnyQualifier = {'*': '*'};

        it('should match empty qualifiers', () => {
          expect(matchesIntentQualifier(AnyQualifier, undefined)).toBeTrue();
          expect(matchesIntentQualifier(AnyQualifier, null)).toBeTrue();
          expect(matchesIntentQualifier(AnyQualifier, {})).toBeTrue();
        });

        it('should match exact qualifier', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'*': '*'})).toBeTrue();
        });

        it('should match qualifier containing specific value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should match qualifier containing specific value and wildcard (?) value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': 'person', 'id': '?'})).toBeTrue();
        });

        it('should match qualifier containing specific value and wildcard (*) value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': 'person', 'id': '*'})).toBeTrue();
        });

        it('should match qualifier containing multiple specific values', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': 'person', 'id': '1'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing multiple wildcard (?) values', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and wildcard (*) value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '?', 'id': '*'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and specific value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '?', 'id': '1'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (*) value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should match qualifier containing multiple wildcard (*) values ', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '*', 'id': '*'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (*) value and wildcard (?) value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '*', 'id': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (*) value and specific value', () => {
          expect(matchesIntentQualifier(AnyQualifier, {'entity': '*', 'id': '1'})).toBeTrue();
        });
      });

      describe('qualifier containing multiple keys', () => {
        describe('qualifier contains additional wildcard (?) qualifier value', () => {
          const CombinedQualifier = {'*': '*', 'type': '?'};

          it('should match empty qualifiers', () => {
            expect(matchesIntentQualifier(CombinedQualifier, undefined)).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, null)).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {})).toBeTrue();
          });

          it('should match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeTrue();
          });
        });

        describe('qualifier contains additional wildcard (*) qualifier value', () => {
          const CombinedQualifier = {'*': '*', 'type': '*'};

          it('should not match empty qualifiers', () => {
            expect(matchesIntentQualifier(CombinedQualifier, undefined)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, null)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {})).toBeFalse();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*'})).toBeFalse();
          });

          it('should match exact qualifier', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {type: 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeTrue();
          });
        });

        describe('qualifier contains additional specific qualifier value', () => {
          const CombinedQualifier = {'*': '*', 'type': 'user'};

          it('should not match empty qualifiers', () => {
            expect(matchesIntentQualifier(CombinedQualifier, undefined)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, null)).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {})).toBeFalse();
          });

          it('should not match `AnyQualifier`', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*'})).toBeFalse();
          });

          it('should match exact qualifier', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'*': '*', 'type': 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {type: 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of (* and ?) for entity and `user` for type', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
          });

          it('should not match qualifier containing a (* and ?) for type', () => {
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeFalse();
            expect(matchesIntentQualifier(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeFalse();
          });
        });
      });
    });
  });

  describe('function \'matchesWildcardQualifier(...)\'', () => {

    function testWildcardQualifierMatcher(qualifier1: Qualifier, qualifier2: Qualifier): boolean {
      const matchingResult = matchesWildcardQualifier(qualifier1, qualifier2);
      const correlationResult = matchesWildcardQualifier(qualifier2, qualifier1);

      if (matchingResult !== correlationResult) {
        throw new Error(`... with qualifiers ${qualifier1} and ${qualifier2}`);
      }

      return matchingResult;
    }

    describe('check against empty qualifier', () => {
      const UndefinedQualifier = undefined;
      const NullQualifier = null;
      const EmptyQualifier = {};

      it('should match empty qualifiers', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, undefined)).toBeTrue();
        expect(testWildcardQualifierMatcher(UndefinedQualifier, null)).toBeTrue();
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {})).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, undefined)).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, null)).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, {})).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, undefined)).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, null)).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {})).toBeTrue();
      });

      it('should match `AnyQualifier`', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'*': '*'})).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, {'*': '*'})).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'*': '*'})).toBeTrue();
      });

      it('should match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'*': '*', 'entity': '?'})).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, {'*': '*', 'entity': '?'})).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'*': '*', 'entity': '?'})).toBeTrue();
      });

      it('should not match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        expect(testWildcardQualifierMatcher(NullQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'*': '*', 'entity': '*'})).toBeFalse();
      });

      it('should not match `AnyQualifier` with additional specific qualifier value', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        expect(testWildcardQualifierMatcher(NullQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'*': '*', 'entity': 'person'})).toBeFalse();
      });

      it('should match qualifier containing wildcard (?) value', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'entity': '?'})).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, {'entity': '?'})).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'entity': '?'})).toBeTrue();

        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        expect(testWildcardQualifierMatcher(NullQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
      });

      it('should not match qualifier containing wildcard (*) value', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'entity': '*'})).toBeFalse();
        expect(testWildcardQualifierMatcher(NullQualifier, {'entity': '*'})).toBeFalse();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'entity': '*'})).toBeFalse();

        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        expect(testWildcardQualifierMatcher(NullQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
      });

      it('should not match qualifier containing specific value', () => {
        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'entity': 'person'})).toBeFalse();
        expect(testWildcardQualifierMatcher(NullQualifier, {'entity': 'person'})).toBeFalse();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'entity': 'person'})).toBeFalse();

        expect(testWildcardQualifierMatcher(UndefinedQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        expect(testWildcardQualifierMatcher(NullQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        expect(testWildcardQualifierMatcher(EmptyQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
      });
    });

    describe('check against qualifier containing specific qualifier value', () => {
      describe('qualifier containing boolean value', () => {
        it('tests strict equality for `true`', () => {
          const BooleanQualifier = {flag: true};
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: true})).toBeTrue();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: false})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: null})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: undefined})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 0})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 1})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 'true'})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 'false'})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: ''})).toBeFalse();
        });

        it('tests strict equality for `false`', () => {
          const BooleanQualifier = {flag: false};
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: false})).toBeTrue();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: true})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: null})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: undefined})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 0})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 1})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 'true'})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: 'false'})).toBeFalse();
          expect(testWildcardQualifierMatcher(BooleanQualifier, {flag: ''})).toBeFalse();
        });
      });

      describe('qualifier containing numeric value', () => {
        const NumericQualifier = {id: 1};

        it('tests strict equality', () => {
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: 1})).toBeTrue();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: '1'})).toBeFalse();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: 2})).toBeFalse();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: undefined})).toBeFalse();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: null})).toBeFalse();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: true})).toBeFalse();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: false})).toBeFalse();
          expect(testWildcardQualifierMatcher(NumericQualifier, {id: ''})).toBeFalse();
        });
      });

      describe('qualifier containing single key', () => {
        const SpecificQualifier = {'entity': 'person'};

        it('should not match empty qualifiers', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, undefined)).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, null)).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {})).toBeFalse();
        });

        it('should match `AnyQualifier`', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'entity': '?'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'entity': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional specific qualifier value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'entity': 'person'})).toBeTrue();
        });

        it('should not match `AnyQualifier` with superfluous qualifier key', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'id': '1'})).toBeFalse();
        });

        it('should match `AnyQualifier` with superfluous optional qualifier key', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'id': '?'})).toBeTrue();
        });

        it('should match exact qualifier', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should match qualifier containing specific value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing specific value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'id': '1'})).toBeFalse();
        });
      });

      describe('qualifier containing multiple keys', () => {
        const SpecificQualifier = {'entity': 'person', 'type': 'user'};

        it('should not match empty qualifiers', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, undefined)).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, null)).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {})).toBeFalse();
        });

        it('should match `AnyQualifier`', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional specific qualifier values', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeTrue();
        });

        it('should not match `AnyQualifier` with superfluous qualifier key', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'id': '1'})).toBeFalse();
        });

        it('should match `AnyQualifier` with superfluous optional qualifier key', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'*': '*', 'id': '?'})).toBeTrue();
        });

        it('should match exact qualifier', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': 'user'})).toBeTrue();
        });

        it('should match qualifier containing specific values and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific values and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
        });

        it('should not match qualifier missing a key', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {type: 'user'})).toBeFalse();
        });

        it('should not match qualifier containing different entity value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'x', 'type': 'user'})).toBeFalse();
        });

        it('should not match qualifier containing different type value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': 'x'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (?) values', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) values', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing a combination of specific values and wildcard values', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
        });

        it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
          expect(testWildcardQualifierMatcher(SpecificQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
        });
      });
    });

    describe('check against qualifier containing wildcard (*) qualifier value', () => {

      describe('qualifier containing single key', () => {
        const AsteriskQualifier = {'entity': '*'};

        it('should not match empty qualifiers', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, undefined)).toBeFalse();
          expect(testWildcardQualifierMatcher(AsteriskQualifier, null)).toBeFalse();
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {})).toBeFalse();
        });

        it('should match `AnyQualifier`', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'entity': '?'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'entity': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional specific qualifier value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'entity': 'person'})).toBeTrue();
        });

        it('should not match `AnyQualifier` with superfluous qualifier key', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'id': '1'})).toBeFalse();
        });

        it('should match `AnyQualifier` with superfluous optional qualifier key', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'id': '?'})).toBeTrue();
        });

        it('should match exact qualifier', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should match qualifier containing specific value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should match qualifier containing specific value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing specific value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'id': '1'})).toBeFalse();
        });
      });

      describe('qualifier containing multiple keys', () => {
        describe('qualifier only contains wildcard (*) qualifier values', () => {
          const AsteriskQualifier = {'entity': '*', 'type': '*'};

          it('should not match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, undefined)).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, null)).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {})).toBeFalse();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional specific qualifier values', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier missing a key', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {type: '*'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(AsteriskQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });

        describe('qualifier contains combination of wildcard (*) and specific qualifier values', () => {
          const CombinedQualifier = {'entity': '*', 'type': 'user'};

          it('should not match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, undefined)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, null)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {})).toBeFalse();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional specific qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should not match qualifier missing a key', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {type: 'user'})).toBeFalse();
          });

          it('should not match qualifier containing different type value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'x'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (?) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });
      });
    });

    describe('check against qualifier containing wildcard (?) qualifier value', () => {
      describe('qualifier containing single key', () => {
        const OptionalQualifier = {'entity': '?'};

        it('should match empty qualifiers', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, undefined)).toBeTrue();
          expect(testWildcardQualifierMatcher(OptionalQualifier, null)).toBeTrue();
          expect(testWildcardQualifierMatcher(OptionalQualifier, {})).toBeTrue();
        });

        it('should match `AnyQualifier`', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (?) qualifier value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'entity': '?'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional wildcard (*) qualifier value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'entity': '*'})).toBeTrue();
        });

        it('should match `AnyQualifier` with additional specific qualifier value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'entity': 'person'})).toBeTrue();
        });

        it('should not match `AnyQualifier` with superfluous qualifier key', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'id': '*'})).toBeFalse();
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'id': '1'})).toBeFalse();
        });

        it('should match `AnyQualifier` with superfluous optional qualifier key', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'id': '?'})).toBeTrue();
        });

        it('should match exact qualifier', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing specific value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should match qualifier containing specific value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing specific value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing specific value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (?) value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'id': '*'})).toBeFalse();
        });

        it('should not match qualifier containing wildcard (?) value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'id': '1'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'id': '*'})).toBeFalse();
        });

        it('should match qualifier containing wildcard (*) value and additional wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'id': '?'})).toBeTrue();
        });

        it('should not match qualifier containing wildcard (*) value and additional specific value', () => {
          expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'id': '1'})).toBeFalse();
        });
      });

      describe('qualifier containing multiple keys', () => {
        describe('qualifier only contains wildcard (?) qualifier values', () => {
          const OptionalQualifier = {'entity': '?', 'type': '?'};

          it('should match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, undefined)).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, null)).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {})).toBeTrue();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional specific qualifier values', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier missing a key', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {type: '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(OptionalQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });

        describe('qualifier contains combination of wildcard (?) and wildcard (*) qualifier values', () => {
          const CombinedQualifier = {'entity': '?', 'type': '*'};

          it('should not match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, undefined)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, null)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {})).toBeFalse();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional specific qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier missing optional key', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {type: '*'})).toBeTrue();
          });

          it('should not match qualifier missing mandatory key', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (?) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });

        describe('qualifier contains combination of wildcard (?) and specific qualifier values', () => {
          const CombinedQualifier = {'entity': '?', 'type': 'user'};

          it('should not match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, undefined)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, null)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {})).toBeFalse();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (?) qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional wildcard (*) qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match `AnyQualifier` with additional specific qualifier values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'entity': 'person', 'type': 'user'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier missing optional key', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {type: 'user'})).toBeTrue();
          });

          it('should not match qualifier missing mandatory key', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?'})).toBeFalse();
          });

          it('should not match qualifier containing different type value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'x'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (?) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeFalse();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeFalse();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeFalse();
          });

          it('should not match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeFalse();
          });
        });
      });
    });

    describe('check against `AnyQualifier`', () => {

      describe('qualifier containing single key', () => {
        const AnyQualifier = {'*': '*'};

        it('should match empty qualifiers', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, undefined)).toBeTrue();
          expect(testWildcardQualifierMatcher(AnyQualifier, null)).toBeTrue();
          expect(testWildcardQualifierMatcher(AnyQualifier, {})).toBeTrue();
        });

        it('should match exact qualifier', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'*': '*'})).toBeTrue();
        });

        it('should match qualifier containing specific value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': 'person'})).toBeTrue();
        });

        it('should match qualifier containing specific value and wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': 'person', 'id': '?'})).toBeTrue();
        });

        it('should match qualifier containing specific value and wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': 'person', 'id': '*'})).toBeTrue();
        });

        it('should match qualifier containing multiple specific values', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': 'person', 'id': '1'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '?'})).toBeTrue();
        });

        it('should match qualifier containing multiple wildcard (?) values', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '?', 'id': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '?', 'id': '*'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (?) value and specific value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '?', 'id': '1'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (*) value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '*'})).toBeTrue();
        });

        it('should match qualifier containing multiple wildcard (*) values ', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '*', 'id': '*'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (*) value and wildcard (?) value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '*', 'id': '?'})).toBeTrue();
        });

        it('should match qualifier containing wildcard (*) value and specific value', () => {
          expect(testWildcardQualifierMatcher(AnyQualifier, {'entity': '*', 'id': '1'})).toBeTrue();
        });
      });

      describe('qualifier containing multiple keys', () => {
        describe('qualifier contains additional wildcard (?) qualifier value', () => {
          const CombinedQualifier = {'*': '*', 'type': '?'};

          it('should match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, undefined)).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, null)).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {})).toBeTrue();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeTrue();
          });
        });

        describe('qualifier contains additional wildcard (*) qualifier value', () => {
          const CombinedQualifier = {'*': '*', 'type': '*'};

          it('should not match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, undefined)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, null)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {})).toBeFalse();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeTrue();
          });
        });

        describe('qualifier contains additional specific qualifier value', () => {
          const CombinedQualifier = {'*': '*', 'type': 'user'};

          it('should not match empty qualifiers', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, undefined)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, null)).toBeFalse();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {})).toBeFalse();
          });

          it('should match `AnyQualifier`', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*'})).toBeTrue();
          });

          it('should match exact qualifier', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'*': '*', 'type': 'user'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing specific values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': 'user', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (?) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '?', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing wildcard (*) values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '*', 'id': '1'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (?) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '?'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '?'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional wildcard (*) value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '*'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '*'})).toBeTrue();
          });

          it('should match qualifier containing a combination of specific values and wildcard values and additional specific value', () => {
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '*', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': 'person', 'type': '?', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': 'user', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '?', 'type': '*', 'id': '1'})).toBeTrue();
            expect(testWildcardQualifierMatcher(CombinedQualifier, {'entity': '*', 'type': '?', 'id': '1'})).toBeTrue();
          });
        });
      });
    });
  });
});
