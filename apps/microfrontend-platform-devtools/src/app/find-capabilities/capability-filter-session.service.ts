/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { Injectable } from '@angular/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import { Capability, Qualifier } from '@scion/microfrontend-platform';
import { map, startWith } from 'rxjs/operators';
import { KeyValuePair, LogicalOperator } from './filter-field/filter-field';
import { DevToolsManifestService } from '../dev-tools-manifest.service';

@Injectable({
  providedIn: 'root',
})
export class CapabilityFilterSession {
  private readonly defaultLogicalOperator: LogicalOperator = 'or';
  private _typeFilters = new Set<string>();
  private _qualifierFilters = new Array<KeyValuePair>();
  private _appFilters = new Set<string>();
  private _typeLogicalOperator: LogicalOperator;
  private _qualifierLogicalOperator: LogicalOperator;
  private _appLogicalOperator: LogicalOperator;
  private _update$ = new Subject<void>();

  constructor(private _manifestService: DevToolsManifestService) {
    this.typeLogicalOperator = this.defaultLogicalOperator;
    this.qualifierLogicalOperator = this.defaultLogicalOperator;
    this.appLogicalOperator = this.defaultLogicalOperator;
  }

  public set typeLogicalOperator(value: LogicalOperator) {
    this._typeLogicalOperator = value;
    this._update$.next();
  }

  public get typeLogicalOperator(): LogicalOperator {
    return this._typeLogicalOperator;
  }

  public set qualifierLogicalOperator(value: LogicalOperator) {
    this._qualifierLogicalOperator = value;
    this._update$.next();
  }

  public get qualifierLogicalOperator(): LogicalOperator {
    return this._qualifierLogicalOperator;
  }

  public set appLogicalOperator(value: LogicalOperator) {
    this._appLogicalOperator = value;
    this._update$.next();
  }

  public get appLogicalOperator(): LogicalOperator {
    return this._appLogicalOperator;
  }

  public capabilities$(): Observable<Capability[]> {
    return combineLatest([
      this._manifestService.capabilities$(),
      this._update$.pipe(startWith(undefined as void)),
    ])
      .pipe(map(([capabilities]) => this.filter(capabilities)));
  }

  private filter(capabilities: Capability[]): Capability[] {
    return capabilities
      .filter(capability => this._typeFilters.size === 0 || this.filterByType(capability))
      .filter(capability => this._qualifierFilters.length === 0 || this.filterByQualifier(capability.qualifier))
      .filter(capability => this._appFilters.size === 0 || this.filterAppByName(capability))
      .sort(capabilityComparator);
  }

  private filterByType(capability: Capability): boolean {
    const typeLowerCase = capability.type.toLowerCase();
    if (this._typeLogicalOperator === 'or') {
      return this._typeFilters.has(typeLowerCase);
    }
    else if (this._typeLogicalOperator === 'and') {
      return Array.from(this._typeFilters).every(type => type === typeLowerCase);
    }
    return false;
  }

  private filterByQualifier(qualifier: Qualifier): boolean {
    if (this._qualifierLogicalOperator === 'or') {
      return this._qualifierFilters.some(it => this.matchesQualifier(it, qualifier));
    }
    else if (this._qualifierLogicalOperator === 'and') {
      return this._qualifierFilters.every(it => this.matchesQualifier(it, qualifier));
    }
    return false;
  }

  private matchesQualifier(filterQualifier: KeyValuePair, qualifier: Qualifier): boolean {
    if (filterQualifier.key && filterQualifier.value) {
      return `${qualifier[filterQualifier.key]}`?.toLowerCase() === filterQualifier.value;
    } else if (filterQualifier.key) {
      return Object.keys(qualifier).map(key => key.toLowerCase()).includes(filterQualifier.key);
    } else if (filterQualifier.value) {
      return Object.values(qualifier).map(value => `${value}`.toLowerCase()).includes(filterQualifier.value);
    }
    return false;
  }

  private filterAppByName(capability: Capability): boolean {
    const appLowerCase = capability.metadata.appSymbolicName.toLowerCase();
    if (this._appLogicalOperator === 'or') {
      return this._appFilters.has(appLowerCase);
    }
    else if (this._appLogicalOperator === 'and') {
      return Array.from(this._appFilters).every(app => app === appLowerCase);
    }
    return false;
  }

  public addTypeFilter(type: string): void {
    const typeLowerCase = type.toLowerCase();
    if (this._typeFilters.has(typeLowerCase)) {
      return;
    }
    this._typeFilters.add(typeLowerCase);
    this._update$.next();
  }

  public removeTypeFilter(type: string): void {
    this._typeFilters.delete(type.toLowerCase()) && this._update$.next();
  }

  public get typeFilters(): string[] {
    return Array.from(this._typeFilters);
  }

  public addQualifierFilter(qualifier: KeyValuePair): void {
    if (this._qualifierFilters.some(it => it.key === qualifier.key?.toLowerCase() && it.value === qualifier.value?.toLowerCase())) {
      return;
    }
    this._qualifierFilters.push({
      key: qualifier.key?.toLowerCase(),
      value: qualifier.value?.toLowerCase(),
    });
    this._update$.next();
  }

  public removeQualifierFilter(qualifier: KeyValuePair): void {
    const index = this._qualifierFilters.findIndex(q => q.key === qualifier.key?.toLowerCase() && q.value === qualifier.value?.toLowerCase());
    if (index !== -1) {
      this._qualifierFilters.splice(index, 1);
    }
    this._update$.next();
  }

  public get qualifierFilters(): KeyValuePair[] {
    return this._qualifierFilters;
  }

  public addAppFilter(app: string): void {
    const appLowerCase = app.toLowerCase();
    if (this._appFilters.has(appLowerCase)) {
      return;
    }
    this._appFilters.add(appLowerCase);
    this._update$.next();
  }

  public removeAppFilter(app: string): void {
    this._appFilters.delete(app.toLowerCase()) && this._update$.next();
  }

  public get appFilters(): string[] {
    return Array.from(this._appFilters);
  }
}

const capabilityComparator = (capability1: Capability, capability2: Capability) => {
  return capability1.metadata.appSymbolicName.localeCompare(capability2.metadata.appSymbolicName) ||
    capability1.type.localeCompare(capability2.type);
};
