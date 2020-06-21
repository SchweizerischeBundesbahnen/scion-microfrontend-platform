/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { ManifestObjectStore } from './manifest-object-store';
import { Capability } from '../../platform.model';
import { matchesIntentQualifier, matchesWildcardQualifier } from '../../qualifier-tester';

describe('CapabilityStore', () => {
  let store: ManifestObjectStore<Capability>;

  beforeEach(() => {
    store = new ManifestObjectStore<Capability>();
  });

  describe('add and find capabilities', () => {

    describe('find using no matching strategy', () => {

      it('should find capabilities by id', () => {
        const undefinedQualifierCapability: Capability = {type: 'type1', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type1', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([undefinedQualifierCapability]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([nullQualifierCapability]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([emptyQualifierCapability]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([asteriskQualifierCapability]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([optionalQualifierCapability]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([exactQualifierCapability]);
      });

      it('should find capabilities by type', () => {
        const undefinedQualifierCapability: Capability = {type: 'type1', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type1', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        expect(store.find({type: 'type1'})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability]);
        expect(store.find({type: 'type2'})).toEqual([asteriskQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type3'})).toEqual([exactQualifierCapability]);
      });

      it('should find capabilities by qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type1', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type1', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        expect(store.find({qualifier: undefined})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({qualifier: null})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability]);
        expect(store.find({qualifier: {}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability]);
        expect(store.find({qualifier: {'*': '*'}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({qualifier: {entity: '*'}})).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({qualifier: {entity: '?'}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({qualifier: {entity: 'test'}})).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
      });

      it('should find capabilities by application', () => {
        const undefinedQualifierCapability: Capability = {type: 'type1', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app1'}};
        const nullQualifierCapability: Capability = {type: 'type1', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app1'}};
        const emptyQualifierCapability: Capability = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app2'}};
        const asteriskQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app2'}};
        const optionalQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app3'}};
        const exactQualifierCapability: Capability = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app3'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        expect(store.find({appSymbolicName: 'app1'})).toEqual([undefinedQualifierCapability, nullQualifierCapability]);
        expect(store.find({appSymbolicName: 'app2'})).toEqual([emptyQualifierCapability, asteriskQualifierCapability]);
        expect(store.find({appSymbolicName: 'app3'})).toEqual([optionalQualifierCapability, exactQualifierCapability]);
      });
    });

    describe('find using \'wildcardMatcher\' strategy', () => {
      it('should not find capabilities if the store is empty', () => {
        expect(store.find({id: 'id'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: undefined}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: null}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: undefined}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: null}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
      });

      it('should find capabilities by id, type and app', () => {
        const capability: Capability = {type: 'type', metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);

        expect(store.find({id: 'id'})).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: null}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: null}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability]);
      });

      it('should find capabilities of the same type', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app1'}};
        const capability2: Capability = {type: 'type', metadata: {id: 'id2', appSymbolicName: 'app2'}};
        store.add(capability1);
        store.add(capability2);

        expect(store.find({id: 'id1'})).toEqual([capability1]);
        expect(store.find({id: 'id2'})).toEqual([capability2]);
        expect(store.find({type: 'type', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: null}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({appSymbolicName: 'app1', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({appSymbolicName: 'app1', qualifier: null}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({appSymbolicName: 'app1', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({appSymbolicName: 'app1', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({appSymbolicName: 'app1', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({appSymbolicName: 'app2', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({appSymbolicName: 'app2', qualifier: null}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({appSymbolicName: 'app2', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({appSymbolicName: 'app2', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({appSymbolicName: 'app2', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability2]);
      });

      it('should find capabilities of the same app', () => {
        const capability1: Capability = {type: 'type1', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type2', metadata: {id: 'id2', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);

        expect(store.find({id: 'id1'})).toEqual([capability1]);
        expect(store.find({id: 'id2'})).toEqual([capability2]);
        expect(store.find({type: 'type1', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: null}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type2', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: null}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability2]);
        expect(store.find({appSymbolicName: 'app', qualifier: undefined}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({appSymbolicName: 'app', qualifier: null}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability1, capability2]);
      });

      it('should find capabilities by app and qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type1', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type1', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type2', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        expect(store.find({appSymbolicName: 'app', qualifier: undefined}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: null}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '*'}}, matchesWildcardQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: 'test'}}, matchesWildcardQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
      });
    });

    describe('find using \'intentMatcher\' strategy', () => {
      it('should not find capabilities if the store is empty', () => {
        expect(store.find({type: 'type', qualifier: undefined}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: null}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesIntentQualifier)).toEqual([]);
      });

      it('should find capability by type', () => {
        const capability: Capability = {type: 'type', metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);

        expect(store.find({type: 'type', qualifier: undefined}, matchesIntentQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: null}, matchesIntentQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {}}, matchesIntentQualifier)).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesIntentQualifier)).toEqual([]);
      });

      it('should find capabilities of the same type', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app1'}};
        const capability2: Capability = {type: 'type', metadata: {id: 'id2', appSymbolicName: 'app2'}};
        store.add(capability1);
        store.add(capability2);

        expect(store.find({type: 'type', qualifier: undefined}, matchesIntentQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: null}, matchesIntentQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: {}}, matchesIntentQualifier)).toEqual([capability1, capability2]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesIntentQualifier)).toEqual([]);
      });

      it('should find capabilities of the same app', () => {
        const capability1: Capability = {type: 'type1', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type2', metadata: {id: 'id2', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);

        expect(store.find({type: 'type1', qualifier: undefined}, matchesIntentQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: null}, matchesIntentQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: {}}, matchesIntentQualifier)).toEqual([capability1]);
        expect(store.find({type: 'type1', qualifier: {entity: '?'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type1', qualifier: {'*': '*'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type2', qualifier: undefined}, matchesIntentQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: null}, matchesIntentQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: {}}, matchesIntentQualifier)).toEqual([capability2]);
        expect(store.find({type: 'type2', qualifier: {entity: '?'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type2', qualifier: {'*': '*'}}, matchesIntentQualifier)).toEqual([]);
      });

      it('should find capabilities by type and qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app1'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app1'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app2'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app2'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app3'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        expect(store.find({type: 'type', qualifier: undefined}, matchesIntentQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: null}, matchesIntentQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {}}, matchesIntentQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesIntentQualifier)).toEqual([]);
        expect(store.find({type: 'type', qualifier: {entity: '*'}}, matchesIntentQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesIntentQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {entity: 'test'}}, matchesIntentQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
      });
    });
  });

  describe('remove capabilities', () => {
    describe('empty store', () => {
      it('should do nothing if no capability with the given id exists', () => {
        store.remove({id: 'non_existant_id', appSymbolicName: 'app'});

        expect(store.find({id: 'non_existant_id'})).toEqual([]);
      });

      it('should do nothing if no capability of given type and qualifier exists (empty qualifier)', () => {
        store.remove({type: 'type', qualifier: undefined, appSymbolicName: 'app'});
        store.remove({type: 'type', qualifier: null, appSymbolicName: 'app'});
        store.remove({type: 'type', qualifier: {}, appSymbolicName: 'app'});

        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([]);
      });

      it('should do nothing if no capability of given type and qualifier exists (absolute wildcard qualifier)', () => {
        store.remove({type: 'type', qualifier: {'*': '*'}, appSymbolicName: 'app'});

        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
      });

      it('should do nothing if no capability of given type and qualifier exists (exact qualifier)', () => {
        store.remove({type: 'type', qualifier: {entity: 'test'}, appSymbolicName: 'app'});

        expect(store.find({type: 'type', qualifier: {entity: 'test'}}, matchesWildcardQualifier)).toEqual([]);
      });
    });

    describe('remove by id', () => {
      it('should remove a capability by id', () => {
        const capability: Capability = {type: 'type', metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);
        store.remove({id: 'id', appSymbolicName: 'app'});

        expect(store.find({id: 'id'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}})).toEqual([]);
      });

      it('should not remove any capability if no capability with the given id exists', () => {
        const capability: Capability = {type: 'type', metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);
        store.remove({id: 'non-existent', appSymbolicName: 'app'});

        expect(store.find({id: 'id'})).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}})).toEqual([capability]);
      });
    });

    describe('check capability isolation', () => {
      it('should remove capabilities of the type \'type1\'', () => {
        const type1QualifierCapability: Capability = {type: 'type1', qualifier: {'*': '*'}, metadata: {id: 'id1', appSymbolicName: 'app'}};
        const type2QualifierCapability: Capability = {type: 'type2', qualifier: {'*': '*'}, metadata: {id: 'id2', appSymbolicName: 'app'}};
        store.add(type1QualifierCapability);
        store.add(type2QualifierCapability);

        store.remove({type: 'type1', qualifier: {'*': '*'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id1'})).toEqual([]);
        expect(store.find({id: 'id2'})).toEqual([type2QualifierCapability]);
        expect(store.find({type: 'type1', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({type: 'type2', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([type2QualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([type2QualifierCapability]);
      });

      it('should remove capabilities of the app \'app1\'', () => {
        const app1QualifierCapability: Capability = {type: 'type', qualifier: {'*': '*'}, metadata: {id: 'id1', appSymbolicName: 'app1'}};
        const app2QualifierCapability: Capability = {type: 'type', qualifier: {'*': '*'}, metadata: {id: 'id2', appSymbolicName: 'app2'}};
        store.add(app1QualifierCapability);
        store.add(app2QualifierCapability);

        store.remove({type: 'type', qualifier: {'*': '*'}, appSymbolicName: 'app1'});

        expect(store.find({id: 'id1'})).toEqual([]);
        expect(store.find({id: 'id2'})).toEqual([app2QualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([app2QualifierCapability]);
        expect(store.find({appSymbolicName: 'app1', qualifier: {'*': '*'}})).toEqual([]);
        expect(store.find({appSymbolicName: 'app2', qualifier: {'*': '*'}})).toEqual([app2QualifierCapability]);
      });
    });

    describe('remove by qualifier', () => {
      it('should remove capabilities matching the `undefined` qualifier', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type', qualifier: undefined, metadata: {id: 'id2', appSymbolicName: 'app'}};
        const capability3: Capability = {type: 'type', qualifier: null, metadata: {id: 'id3', appSymbolicName: 'app'}};
        const capability4: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id4', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);
        store.add(capability3);
        store.add(capability4);
        store.remove({type: 'type', qualifier: undefined, appSymbolicName: 'app'});

        expect(store.find({id: 'id1'})).toEqual([]);
        expect(store.find({id: 'id2'})).toEqual([]);
        expect(store.find({id: 'id3'})).toEqual([]);
        expect(store.find({id: 'id4'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([]);
      });

      it('should remove capabilities matching the `null` qualifier', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type', qualifier: undefined, metadata: {id: 'id2', appSymbolicName: 'app'}};
        const capability3: Capability = {type: 'type', qualifier: null, metadata: {id: 'id3', appSymbolicName: 'app'}};
        const capability4: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id4', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);
        store.add(capability3);
        store.add(capability4);
        store.remove({type: 'type', qualifier: null, appSymbolicName: 'app'});

        expect(store.find({id: 'id1'})).toEqual([]);
        expect(store.find({id: 'id2'})).toEqual([]);
        expect(store.find({id: 'id3'})).toEqual([]);
        expect(store.find({id: 'id4'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([]);
      });

      it('should remove capabilities matching the empty qualifier', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type', qualifier: undefined, metadata: {id: 'id2', appSymbolicName: 'app'}};
        const capability3: Capability = {type: 'type', qualifier: null, metadata: {id: 'id3', appSymbolicName: 'app'}};
        const capability4: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id4', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);
        store.add(capability3);
        store.add(capability4);
        store.remove({type: 'type', qualifier: {}, appSymbolicName: 'app'});

        expect(store.find({id: 'id1'})).toEqual([]);
        expect(store.find({id: 'id2'})).toEqual([]);
        expect(store.find({id: 'id3'})).toEqual([]);
        expect(store.find({id: 'id4'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([]);
      });

      it('should not interpret wildcards in the qualifier when removing capabilities (optional wildcard as qualifier value)', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type', qualifier: undefined, metadata: {id: 'id2', appSymbolicName: 'app'}};
        const capability3: Capability = {type: 'type', qualifier: null, metadata: {id: 'id3', appSymbolicName: 'app'}};
        const capability4: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id4', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);
        store.add(capability3);
        store.add(capability4);
        store.remove({type: 'type', qualifier: {entity: '?'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id1'})).toEqual([capability1]);
        expect(store.find({id: 'id2'})).toEqual([capability2]);
        expect(store.find({id: 'id3'})).toEqual([capability3]);
        expect(store.find({id: 'id4'})).toEqual([capability4]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability1, capability2, capability3, capability4]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([capability1, capability2, capability3, capability4]);
      });

      it('should not interpret wildcards in the qualifier when removing capabilities (asterisk wildcard as qualifier key and value)', () => {
        const capability1: Capability = {type: 'type', metadata: {id: 'id1', appSymbolicName: 'app'}};
        const capability2: Capability = {type: 'type', qualifier: undefined, metadata: {id: 'id2', appSymbolicName: 'app'}};
        const capability3: Capability = {type: 'type', qualifier: null, metadata: {id: 'id3', appSymbolicName: 'app'}};
        const capability4: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id4', appSymbolicName: 'app'}};
        store.add(capability1);
        store.add(capability2);
        store.add(capability3);
        store.add(capability4);
        store.remove({type: 'type', qualifier: {'*': '*'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id1'})).toEqual([capability1]);
        expect(store.find({id: 'id2'})).toEqual([capability2]);
        expect(store.find({id: 'id3'})).toEqual([capability3]);
        expect(store.find({id: 'id4'})).toEqual([capability4]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([capability1, capability2, capability3, capability4]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([capability1, capability2, capability3, capability4]);
      });

      it('should remove capabilities using an exact qualifier as deletion criterion', () => {
        const capability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);
        store.remove({type: 'type', qualifier: {entity: 'test'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {entity: 'test'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: 'test'}})).toEqual([]);
      });

      it('should remove capabilities which contain the asterisk value wildcard in their qualifier', () => {
        const capability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);
        store.remove({type: 'type', qualifier: {entity: 'test'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id'})).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {entity: '*'}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '*'}})).toEqual([capability]);
      });

      it('should remove capabilities which contain the optional value wildcard in their qualifier', () => {
        const capability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id', appSymbolicName: 'app'}};
        store.add(capability);
        store.remove({type: 'type', qualifier: {entity: 'test'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id'})).toEqual([capability]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([capability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '?'}})).toEqual([capability]);
      });

      it('should remove capabilities matching the `undefined` qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        store.remove({type: 'type', qualifier: undefined, appSymbolicName: 'app'});

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: undefined}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: undefined})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([]);
      });

      it('should remove capabilities matching the `null` qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        store.remove({type: 'type', qualifier: null, appSymbolicName: 'app'});

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([asteriskQualifierCapability]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([optionalQualifierCapability]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: null}, matchesWildcardQualifier)).toEqual([optionalQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: null})).toEqual([optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
      });

      it('should remove capabilities matching the empty qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        store.remove({type: 'type', qualifier: {}, appSymbolicName: 'app'});

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([asteriskQualifierCapability]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([optionalQualifierCapability]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {}}, matchesWildcardQualifier)).toEqual([optionalQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {}})).toEqual([optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([asteriskQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
      });

      it('should remove capabilities which contain the asterisk value wildcard in their qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        store.remove({type: 'type', qualifier: {entity: '*'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([undefinedQualifierCapability]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([nullQualifierCapability]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([emptyQualifierCapability]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([optionalQualifierCapability]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {entity: '*'}}, matchesWildcardQualifier)).toEqual([optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '*'}})).toEqual([optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, optionalQualifierCapability, exactQualifierCapability]);
      });

      it('should remove capabilities which contain the optional value wildcard in their qualifier', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        store.remove({type: 'type', qualifier: {entity: '?'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([undefinedQualifierCapability]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([nullQualifierCapability]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([emptyQualifierCapability]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([asteriskQualifierCapability]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {entity: '?'}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {entity: '?'}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, exactQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, exactQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, exactQualifierCapability]);
      });

      it('should remove capabilities using an exact qualifier as deletion criterion', () => {
        const undefinedQualifierCapability: Capability = {type: 'type', metadata: {id: 'id_undefinedQualifierCapability', appSymbolicName: 'app'}};
        const nullQualifierCapability: Capability = {type: 'type', qualifier: null, metadata: {id: 'id_nullQualifierCapability', appSymbolicName: 'app'}};
        const emptyQualifierCapability: Capability = {type: 'type', qualifier: {}, metadata: {id: 'id_emptyQualifierCapability', appSymbolicName: 'app'}};
        const asteriskQualifierCapability: Capability = {type: 'type', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierCapability', appSymbolicName: 'app'}};
        const optionalQualifierCapability: Capability = {type: 'type', qualifier: {entity: '?'}, metadata: {id: 'id_optionalQualifierCapability', appSymbolicName: 'app'}};
        const exactQualifierCapability: Capability = {type: 'type', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierCapability', appSymbolicName: 'app'}};

        store.add(undefinedQualifierCapability);
        store.add(nullQualifierCapability);
        store.add(emptyQualifierCapability);
        store.add(asteriskQualifierCapability);
        store.add(optionalQualifierCapability);
        store.add(exactQualifierCapability);

        store.remove({type: 'type', qualifier: {entity: 'test'}, appSymbolicName: 'app'});

        expect(store.find({id: 'id_undefinedQualifierCapability'})).toEqual([undefinedQualifierCapability]);
        expect(store.find({id: 'id_nullQualifierCapability'})).toEqual([nullQualifierCapability]);
        expect(store.find({id: 'id_emptyQualifierCapability'})).toEqual([emptyQualifierCapability]);
        expect(store.find({id: 'id_asteriskQualifierCapability'})).toEqual([asteriskQualifierCapability]);
        expect(store.find({id: 'id_optionalQualifierCapability'})).toEqual([optionalQualifierCapability]);
        expect(store.find({id: 'id_exactQualifierCapability'})).toEqual([]);
        expect(store.find({type: 'type', qualifier: {entity: 'test'}}, matchesWildcardQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {entity: 'test'}}, matchesWildcardQualifier)).toEqual([asteriskQualifierCapability, optionalQualifierCapability]);
        expect(store.find({type: 'type', qualifier: {'*': '*'}}, matchesWildcardQualifier)).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability]);
        expect(store.find({appSymbolicName: 'app', qualifier: {'*': '*'}})).toEqual([undefinedQualifierCapability, nullQualifierCapability, emptyQualifierCapability, asteriskQualifierCapability, optionalQualifierCapability]);
      });
    });
  });
});
