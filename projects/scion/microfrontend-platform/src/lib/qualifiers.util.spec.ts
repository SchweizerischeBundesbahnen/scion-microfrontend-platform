/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Qualifiers} from './qualifiers.util';

describe('Qualifiers', () => {

  it('should validate a qualifier', () => {
    expect(Qualifiers.validateQualifier(null, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier(null, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier(undefined, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier(undefined, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({entity: 'person'}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({entity: 'person'}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({entity: '*'}, {exactQualifier: true})).toMatch(/IllegalQualifierError/);
    expect(Qualifiers.validateQualifier({entity: '*'}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({entity: '?'}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({entity: '?'}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({entity: 'person', '*': '_'}, {exactQualifier: true})).toMatch(/IllegalQualifierError/);
    expect(Qualifiers.validateQualifier({entity: 'person', '*': '_'}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({entity: null}, {exactQualifier: true})).toMatch(/IllegalQualifierError/);
    expect(Qualifiers.validateQualifier({entity: null}, {exactQualifier: false})).toMatch(/IllegalQualifierError/);

    expect(Qualifiers.validateQualifier({entity: undefined}, {exactQualifier: true})).toMatch(/IllegalQualifierError/);
    expect(Qualifiers.validateQualifier({entity: undefined}, {exactQualifier: false})).toMatch(/IllegalQualifierError/);

    expect(Qualifiers.validateQualifier({entity: ''}, {exactQualifier: true})).toMatch(/IllegalQualifierError/);
    expect(Qualifiers.validateQualifier({entity: ''}, {exactQualifier: false})).toMatch(/IllegalQualifierError/);

    expect(Qualifiers.validateQualifier({stringEntry: 'string'}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({stringEntry: 'string'}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({numberEntry: 123}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({numberEntry: 123}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({numberEntry: 0}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({numberEntry: 0}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({booleanEntry: true}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({booleanEntry: true}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({booleanEntry: false}, {exactQualifier: true})).toBeNull();
    expect(Qualifiers.validateQualifier({booleanEntry: false}, {exactQualifier: false})).toBeNull();

    expect(Qualifiers.validateQualifier({objectEntry: {} as any}, {exactQualifier: true})).toMatch(/IllegalQualifierError/);
    expect(Qualifiers.validateQualifier({objectEntry: {} as any}, {exactQualifier: false})).toMatch(/IllegalQualifierError/);
  });
});
