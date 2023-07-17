/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ManifestObject, ManifestObjectStore} from './manifest-object-store';

describe('ManifestObjectStore', () => {
  let store: ManifestObjectStore<ManifestObject>;

  beforeEach(() => {
    store = new ManifestObjectStore<ManifestObject>();
  });

  describe('add and find manifest objects', () => {
    it('should not find manifest objects if the store is empty', () => {
      expect(store.find({})).toEqual([]);
    });

    it('should find manifest objects by id', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({id: 'id_undefinedQualifierManifestObject'})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_nullQualifierManifestObject'})).toEqual([nullQualifierManifestObject]);
      expect(store.find({id: 'id_emptyQualifierManifestObject'})).toEqual([emptyQualifierManifestObject]);
      expect(store.find({id: 'id_asteriskQualifierManifestObject'})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({id: 'id_exactQualifierManifestObject'})).toEqual([exactQualifierManifestObject]);
      expect(store.find({id: 'id_anyQualifierManifestObject'})).toEqual([anyQualifierManifestObject]);
    });

    it('should find manifest objects by type', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({type: 'type1'})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({type: 'type2'})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({type: 'type3'})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
    });

    it('should find manifest objects by qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({qualifier: undefined})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject, asteriskQualifierManifestObject, exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({qualifier: null!})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({qualifier: {}})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({qualifier: {'*': '*'}})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject, asteriskQualifierManifestObject, exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({qualifier: {entity: '*'}})).toEqual([asteriskQualifierManifestObject, exactQualifierManifestObject]);
      expect(store.find({qualifier: {entity: 'test'}})).toEqual([exactQualifierManifestObject]);
    });

    it('should find manifest objects by application', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app1'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app1'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app2'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app2'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app3'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app3'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({appSymbolicName: 'app1'})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app2'})).toEqual([emptyQualifierManifestObject, asteriskQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app3'})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
    });

    it('should find manifest objects by id and other filter criteria', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app1'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app1'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app2'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app2'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app3'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app1'})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app2'})).toEqual([]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', type: 'type1'})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', type: 'type2'})).toEqual([]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', qualifier: undefined})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', qualifier: null!})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', qualifier: {}})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', qualifier: {'*': '*'}})).toEqual([undefinedQualifierManifestObject]);
      expect(store.find({id: 'id_undefinedQualifierManifestObject', qualifier: {entity: '*'}})).toEqual([]);
    });

    it('should find manifest objects by type and other filter criteria', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app1'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app1'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app2'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app2'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app3'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app3'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({type: 'type1', appSymbolicName: 'app1'})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject]);
      expect(store.find({type: 'type1', appSymbolicName: 'app2'})).toEqual([emptyQualifierManifestObject]);
      expect(store.find({type: 'type1', appSymbolicName: 'app3'})).toEqual([]);
      expect(store.find({type: 'type1', qualifier: undefined})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({type: 'type1', qualifier: null!})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({type: 'type1', qualifier: {}})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({type: 'type1', qualifier: {'*': '*'}})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject]);
      expect(store.find({type: 'type1', qualifier: {entity: '*'}})).toEqual([]);
      expect(store.find({type: 'type2', appSymbolicName: 'app1'})).toEqual([]);
      expect(store.find({type: 'type2', appSymbolicName: 'app2'})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({type: 'type2', appSymbolicName: 'app3'})).toEqual([]);
      expect(store.find({type: 'type2', qualifier: undefined})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({type: 'type2', qualifier: null!})).toEqual([]);
      expect(store.find({type: 'type2', qualifier: {}})).toEqual([]);
      expect(store.find({type: 'type2', qualifier: {'*': '*'}})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({type: 'type2', qualifier: {entity: '*'}})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({type: 'type3', appSymbolicName: 'app1'})).toEqual([]);
      expect(store.find({type: 'type3', appSymbolicName: 'app2'})).toEqual([]);
      expect(store.find({type: 'type3', appSymbolicName: 'app3'})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({type: 'type3', qualifier: undefined})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({type: 'type3', qualifier: null!})).toEqual([]);
      expect(store.find({type: 'type3', qualifier: {}})).toEqual([]);
      expect(store.find({type: 'type3', qualifier: {'*': '*'}})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({type: 'type3', qualifier: {entity: '*'}})).toEqual([exactQualifierManifestObject]);
    });

    it('should find manifest objects by application and other filter criteria', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app1'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app1'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app2'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app2'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app3'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app3'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      expect(store.find({appSymbolicName: 'app1', qualifier: undefined})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app1', qualifier: null!})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app1', qualifier: {}})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app1', qualifier: {'*': '*'}})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app1', qualifier: {entity: '*'}})).toEqual([]);
      expect(store.find({appSymbolicName: 'app2', qualifier: undefined})).toEqual([emptyQualifierManifestObject, asteriskQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app2', qualifier: null!})).toEqual([emptyQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app2', qualifier: {}})).toEqual([emptyQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app2', qualifier: {'*': '*'}})).toEqual([emptyQualifierManifestObject, asteriskQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app2', qualifier: {entity: '*'}})).toEqual([asteriskQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app3', qualifier: undefined})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app3', qualifier: null!})).toEqual([]);
      expect(store.find({appSymbolicName: 'app3', qualifier: {}})).toEqual([]);
      expect(store.find({appSymbolicName: 'app3', qualifier: {'*': '*'}})).toEqual([exactQualifierManifestObject, anyQualifierManifestObject]);
      expect(store.find({appSymbolicName: 'app3', qualifier: {entity: '*'}})).toEqual([exactQualifierManifestObject]);
    });
  });

  describe('remove manifest objects', () => {
    it('should do nothing if manifest store is empty', () => {
      store.remove({id: 'some_id'});
      store.remove({type: 'type'});
      store.remove({appSymbolicName: 'app'});
      store.remove({qualifier: {}});
      expect(store.find({})).toEqual([]);
    });

    it('should remove manifest objects by id', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({id: 'id_undefinedQualifierManifestObject'});
      store.remove({id: 'id_nullQualifierManifestObject'});
      store.remove({id: 'id_emptyQualifierManifestObject'});
      store.remove({id: 'id_asteriskQualifierManifestObject'});
      store.remove({id: 'id_exactQualifierManifestObject'});
      store.remove({id: 'id_anyQualifierManifestObject'});

      expect(store.find({})).toEqual([]);
    });

    it('should remove manifest objects matching the `undefined` qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({qualifier: undefined});

      expect(store.find({})).toEqual([]);
    });

    it('should remove manifest objects matching the `null` qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({qualifier: null!});

      expect(store.find({})).toEqual([asteriskQualifierManifestObject, exactQualifierManifestObject, anyQualifierManifestObject]);
    });

    it('should remove manifest objects matching the empty qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({qualifier: {}});

      expect(store.find({})).toEqual([asteriskQualifierManifestObject, exactQualifierManifestObject, anyQualifierManifestObject]);
    });

    it('should remove manifest objects matching the asterisk wildcard qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({qualifier: {entity: '*'}});

      expect(store.find({})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject, anyQualifierManifestObject]);
    });

    it('should remove manifest objects matching the exact qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({qualifier: {entity: 'test'}});

      expect(store.find({})).toEqual([undefinedQualifierManifestObject, nullQualifierManifestObject, emptyQualifierManifestObject, asteriskQualifierManifestObject, anyQualifierManifestObject]);
    });

    it('should remove manifest objects matching the any-more wildcard (**) qualifier', () => {
      const undefinedQualifierManifestObject: ManifestObject = {type: 'type1', metadata: {id: 'id_undefinedQualifierManifestObject', appSymbolicName: 'app'}};
      const nullQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: null!, metadata: {id: 'id_nullQualifierManifestObject', appSymbolicName: 'app'}};
      const emptyQualifierManifestObject: ManifestObject = {type: 'type1', qualifier: {}, metadata: {id: 'id_emptyQualifierManifestObject', appSymbolicName: 'app'}};
      const asteriskQualifierManifestObject: ManifestObject = {type: 'type2', qualifier: {entity: '*'}, metadata: {id: 'id_asteriskQualifierManifestObject', appSymbolicName: 'app'}};
      const exactQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {entity: 'test'}, metadata: {id: 'id_exactQualifierManifestObject', appSymbolicName: 'app'}};
      const anyQualifierManifestObject: ManifestObject = {type: 'type3', qualifier: {'*': '*'}, metadata: {id: 'id_anyQualifierManifestObject', appSymbolicName: 'app'}};

      store.add(undefinedQualifierManifestObject);
      store.add(nullQualifierManifestObject);
      store.add(emptyQualifierManifestObject);
      store.add(asteriskQualifierManifestObject);
      store.add(exactQualifierManifestObject);
      store.add(anyQualifierManifestObject);

      store.remove({qualifier: {'*': '*'}});

      expect(store.find({})).toEqual([]);
    });
  });
});
