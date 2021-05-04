/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { QualifierMatcher } from '../../qualifier-matcher';
import { Observable, Subject } from 'rxjs';
import { Arrays, Maps } from '@scion/toolkit/util';
import { Qualifier } from '../../platform.model';

/**
 * Provides an in-memory store for provided capabilities and registered intentions.
 *
 * @ignore
 */
export class ManifestObjectStore<T extends ManifestObject> {

  private readonly _objectById = new Map<string, T>();
  private readonly _objectsByType = new Map<string, T[]>();
  private readonly _objectsByApplication = new Map<string, T[]>();
  private readonly _change$ = new Subject<void>();

  /**
   * Adds the given {@link ManifestObject} to this store.
   */
  public add(object: T): void {
    this._objectById.set(object.metadata!.id, object);
    Maps.addListValue(this._objectsByType, object.type, object);
    Maps.addListValue(this._objectsByApplication, object.metadata!.appSymbolicName, object);
    this._change$.next();
  }

  /**
   * Removes manifest objects from this store that match the given filter.
   *
   * @param filter - Control which manifest objects to remove by specifying filter criteria which are "AND"ed together.
   *        Wildcards in the qualifier criterion, if any, are not interpreted as wildcards, but as exact values instead.
   */
  public remove(filter: ManifestObjectFilter): void {
    const objectsToRemove = this.find(filter);
    this._remove(objectsToRemove);
  }

  /**
   * Finds manifest objects that match the given filter.
   *
   * @param filter - Control which manifest objects to return.
   *        Specified filter criteria are "AND"ed together. If no filter criteria are specified, all objects will be returned.
   * @param qualifierPredicate - Predicate for testing qualifiers; is used in combination with a qualifier filter.
   *        If not specifying a predicate, qualifiers will be matched against the specified qualifier filter, supporting
   *        the asterisk wildcard, but not the optional wildcard character.
   */
  public find(filter: ManifestObjectFilter, qualifierPredicate?: (testee: Qualifier) => boolean): T[] {
    const filterById = filter.id !== undefined;
    const filterByType = filter.type !== undefined;
    const filterByApp = filter.appSymbolicName !== undefined;

    return Arrays
      .intersect(
        filterById ? Arrays.coerce(this._objectById.get(filter.id!)) : undefined,
        filterByType ? Arrays.coerce(this._objectsByType.get(filter.type!)) : undefined,
        filterByApp ? Arrays.coerce(this._objectsByApplication.get(filter.appSymbolicName!)) : undefined,
        (filterById || filterByType || filterByApp) ? undefined : Array.from(this._objectById.values()),
      )
      .filter(object => {
        if (filter.qualifier === undefined) {
          return true;
        }
        if (qualifierPredicate) {
          return qualifierPredicate(object.qualifier || {});
        }

        return new QualifierMatcher(filter.qualifier, {evalAsterisk: true, evalOptional: false}).matches(object.qualifier);
      });
  }

  /**
   * Emits when an object is added to or removed from this store.
   */
  public get change$(): Observable<void> {
    return this._change$.asObservable();
  }

  /**
   * Removes the given objects from all internal maps.
   */
  private _remove(objects: T[]): void {
    let deleted = false;
    objects.forEach(object => {
      const objectId = object.metadata!.id;
      deleted = this._objectById.delete(objectId) || deleted;
      deleted = Maps.removeListValue(this._objectsByType, object.type, candidate => candidate.metadata?.id === objectId) || deleted;
      deleted = Maps.removeListValue(this._objectsByApplication, object.metadata!.appSymbolicName, candidate => candidate.metadata?.id === objectId) || deleted;
    });
    deleted && this._change$.next();
  }
}

/**
 * Represents an object in the manifest registry like a capability or an intention.
 *
 * @ignore
 */
export interface ManifestObject {
  type: string;
  qualifier?: Qualifier;
  metadata?: {
    id: string;
    appSymbolicName: string;
  };
}

/**
 * Allows filtering manifest objects like capabilities or intentions.
 *
 * All specified filter criteria are "AND"ed together. Unspecified filter criteria are ignored.
 * If no filter criterion is specified, no filtering takes place, thus all available objects are returned.
 *
 * @category Manifest
 */
export interface ManifestObjectFilter {
  /**
   * Manifest objects of the given identity.
   */
  id?: string;
  /**
   * Manifest objects of the given function type.
   */
  type?: string;
  /**
   * Manifest objects matching the given qualifier.
   */
  qualifier?: Qualifier;
  /**
   * Manifest objects provided by the given app.
   */
  appSymbolicName?: string;
}
