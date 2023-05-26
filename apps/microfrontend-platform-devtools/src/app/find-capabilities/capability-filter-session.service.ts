/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Capability, Qualifier} from '@scion/microfrontend-platform';
import {expand, map, take} from 'rxjs/operators';
import {KeyValuePair, LogicalOperator} from './filter-field/filter-field';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Arrays} from '@scion/toolkit/util';

@Injectable({providedIn: 'root'})
export class CapabilityFilterSession {

  private _idFilters = new Set<string>();
  private _typeFilters = new Set<string>();
  private _qualifierFilters = new Array<KeyValuePair>();
  private _appFilters = new Set<string>();
  private _qualifierLogicalOperator: LogicalOperator;
  private _filterChange$ = new Subject<void>();

  constructor(private _manifestService: DevToolsManifestService) {
    this.qualifierLogicalOperator = 'or';
  }

  public set qualifierLogicalOperator(value: LogicalOperator) {
    this._qualifierLogicalOperator = value;
    this._filterChange$.next();
  }

  public get qualifierLogicalOperator(): LogicalOperator {
    return this._qualifierLogicalOperator;
  }

  public capabilities$(): Observable<Capability[]> {
    return this._manifestService.capabilities$()
      .pipe(
        expand(capabilities => this._filterChange$.pipe(take(1), map(() => capabilities))),
        map(capabilities => this.filter(capabilities)),
      );
  }

  private filter(capabilities: Capability[]): Capability[] {
    return capabilities
      .filter(capability => this._idFilters.size === 0 || this.filterById(capability))
      .filter(capability => this._typeFilters.size === 0 || this.filterByType(capability))
      .filter(capability => this._qualifierFilters.length === 0 || this.filterByQualifier(capability.qualifier))
      .filter(capability => this._appFilters.size === 0 || this.filterAppByName(capability))
      .sort(capabilityComparator);
  }

  private filterById(capability: Capability): boolean {
    return this._idFilters.has(capability.metadata.id);
  }

  private filterByType(capability: Capability): boolean {
    const capabilityType = capability.type.toLowerCase();
    return Array.from(this._typeFilters).some(typeFilter => typeFilter.toLowerCase() === capabilityType);
  }

  private filterByQualifier(qualifier: Qualifier): boolean {
    if (this._qualifierLogicalOperator === 'and') {
      return this._qualifierFilters.every(it => this.matchesQualifier(it, qualifier));
    }
    else {
      return this._qualifierFilters.some(it => this.matchesQualifier(it, qualifier));
    }
  }

  private matchesQualifier(filterQualifier: KeyValuePair, qualifier: Qualifier): boolean {
    const filterKey = filterQualifier.key?.toLowerCase();
    const filterValue = filterQualifier.value?.toLowerCase();

    if (filterKey && filterValue) {
      const index = Object.keys(qualifier).map(key => key.toLowerCase()).indexOf(filterKey);
      return `${Object.values(qualifier)[index]}`.toLowerCase() === `${filterValue}`;
    }
    else if (filterKey) {
      return Object.keys(qualifier).map(key => key.toLowerCase()).includes(filterKey);
    }
    else if (filterValue) {
      return Object.values(qualifier).some(qualifierValue => `${qualifierValue}`.toLowerCase() === `${filterValue}`);
    }
    return false;
  }

  private filterAppByName(capability: Capability): boolean {
    const symbolicName = capability.metadata.appSymbolicName.toLowerCase();
    return Array.from(this._appFilters).some(appFilter => appFilter.toLowerCase() === symbolicName);
  }

  public addIdFilter(id: string): void {
    if (this._idFilters.has(id)) {
      return;
    }
    this._idFilters.add(id);
    this._filterChange$.next();
  }

  public removeIdFilter(id: string): void {
    this._idFilters.delete(id) && this._filterChange$.next();
  }

  public get idFilters(): string[] {
    return Array.from(this._idFilters);
  }

  public addTypeFilter(type: string): void {
    if (this._typeFilters.has(type)) {
      return;
    }
    this._typeFilters.add(type);
    this._filterChange$.next();
  }

  public removeTypeFilter(type: string): void {
    this._typeFilters.delete(type) && this._filterChange$.next();
  }

  public get typeFilters(): string[] {
    return Array.from(this._typeFilters);
  }

  public addQualifierFilter(qualifier: KeyValuePair): void {
    if (this._qualifierFilters.some(it => it.key === qualifier.key && it.value === qualifier.value)) {
      return;
    }
    this._qualifierFilters.push({
      key: qualifier.key,
      value: qualifier.value,
    });
    this._filterChange$.next();
  }

  public removeQualifierFilter(qualifier: KeyValuePair): void {
    Arrays.remove(this._qualifierFilters, filter => filter.key === qualifier.key && filter.value === qualifier.value);
    this._filterChange$.next();
  }

  public get qualifierFilters(): KeyValuePair[] {
    return this._qualifierFilters;
  }

  public addAppFilter(symbolicName: string): void {
    if (this._appFilters.has(symbolicName)) {
      return;
    }
    this._appFilters.add(symbolicName);
    this._filterChange$.next();
  }

  public removeAppFilter(symbolicName: string): void {
    this._appFilters.delete(symbolicName) && this._filterChange$.next();
  }

  public get appFilters(): string[] {
    return Array.from(this._appFilters);
  }
}

const capabilityComparator = (capability1: Capability, capability2: Capability): number => {
  return capability1.metadata.appSymbolicName.localeCompare(capability2.metadata.appSymbolicName) ||
    capability1.type.localeCompare(capability2.type);
};
