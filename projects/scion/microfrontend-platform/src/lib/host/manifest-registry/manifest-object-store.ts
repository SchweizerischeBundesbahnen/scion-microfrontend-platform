/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {QualifierMatcher} from '../../qualifier-matcher';
import {merge, Observable, Subject} from 'rxjs';
import {Arrays, Maps} from '@scion/toolkit/util';
import {Qualifier} from '../../platform.model';
import {ManifestObject, ManifestObjectFilter} from './manifest-object.model';
import {map} from 'rxjs/operators';
import {Predicate} from '../message-broker/predicates.util';

/**
 * Provides an in-memory store for provided capabilities and registered intentions.
 *
 * @ignore
 */
export class ManifestObjectStore<T extends ManifestObject> {

  private readonly _objectById = new Map<string, T>();
  private readonly _objectsByType = new Map<string, T[]>();
  private readonly _objectsByApplication = new Map<string, T[]>();
  private readonly _add$ = new Subject<T>();
  private readonly _remove$ = new Subject<T[]>();

  /**
   * Adds the given {@link ManifestObject} to this store.
   */
  public add(object: T): void {
    this._objectById.set(object.metadata!.id, object);
    Maps.addListValue(this._objectsByType, object.type, object);
    Maps.addListValue(this._objectsByApplication, object.metadata!.appSymbolicName, object);
    this._add$.next(object);
  }

  /**
   * Removes manifest objects from this store that match the given filter.
   *
   * @param filter - Control which manifest objects to remove by specifying filter criteria which are "AND"ed together.
   *        Wildcards in the qualifier criterion, if any, are interpreted as such.
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
   */
  public find(filter: ɵManifestObjectFilter): T[] {
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
        if (typeof filter.qualifier === 'function') {
          return filter.qualifier(object.qualifier || {});
        }

        return new QualifierMatcher(filter.qualifier).matches(object.qualifier);
      });
  }

  /**
   * Emits when an object is added to or removed from this store.
   */
  public get change$(): Observable<void> {
    return merge(this.add$, this.remove$).pipe(map(() => undefined as void));
  }

  /**
   * Emits when an object is added to this store.
   */
  public get add$(): Observable<T> {
    return this._add$;
  }

  /**
   * Emits when object(s) are removed from this store.
   */
  public get remove$(): Observable<T[]> {
    return this._remove$;
  }

  /**
   * Removes the given objects from all internal maps.
   */
  private _remove(objects: T[]): void {
    const deleted = new Set<T>();
    objects.forEach(object => {
      const objectId = object.metadata!.id;
      if (this._objectById.delete(objectId)) {
        Maps.removeListValue(this._objectsByType, object.type, candidate => candidate.metadata?.id === objectId);
        Maps.removeListValue(this._objectsByApplication, object.metadata!.appSymbolicName, candidate => candidate.metadata?.id === objectId);
        deleted.add(object);
      }
    });
    deleted.size && this._remove$.next(objects);
  }
}

/**
 * Like {@link ManifestObjectFilter}, but allows passing a predicate as qualifier filter.
 *
 * @internal
 */
export interface ɵManifestObjectFilter extends Omit<ManifestObjectFilter, 'qualifier'> {
  qualifier?: Qualifier | Predicate<Qualifier>;
}
