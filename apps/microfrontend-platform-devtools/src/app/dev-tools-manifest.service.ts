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
import {Observable} from 'rxjs';
import {Application, Capability, Intention, ManifestObjectFilter, ManifestService, QualifierMatcher} from '@scion/microfrontend-platform';
import {map} from 'rxjs/operators';
import {combineArray, distinctArray, filterArray, mapArray, sortArray} from '@scion/toolkit/operators';

@Injectable({providedIn: 'root'})
export class DevToolsManifestService {

  private readonly _appsBySymbolicName: Map<string, Application>;

  constructor(private _manifestService: ManifestService) {
    this._appsBySymbolicName = new Map<string, Application>(this.applications.map(app => [app.symbolicName, app]));
  }

  public get applications(): ReadonlyArray<Application> {
    return this._manifestService.applications;
  }

  public getApplication(appSymbolicName: string): Application | undefined {
    return this._appsBySymbolicName.get(appSymbolicName);
  }

  public intentions$(filter: ManifestObjectFilter): Observable<Intention[]> {
    return this._manifestService.lookupIntentions$(filter)
      .pipe(sortArray((a, b) => a.type.localeCompare(b.type)));
  }

  public capabilities$(filter?: ManifestObjectFilter): Observable<Capability[]> {
    return this._manifestService.lookupCapabilities$(filter)
      .pipe(sortArray((a, b) => a.type.localeCompare(b.type)));
  }

  /**
   * Observable that emits applications that provide a capability fulfilling the given intention.
   */
  public capabilityProviders$(intention: Intention): Observable<Application[]> {
    return this.findFulfillingCapabilities$(intention)
      .pipe(
        mapArray(capability => capability.metadata!.appSymbolicName),
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
        mapArray(appSymbolicName => this.getApplication(appSymbolicName)!),
      );
  }

  /**
   * Observable that emits applications that declare an intention fulfilling the given capability.
   */
  public capabilityConsumers$(capability: Capability): Observable<Application[]> {
    return this.findFulfillingIntentions$(capability)
      .pipe(
        mapArray(intention => intention.metadata!.appSymbolicName),
        map(apps => apps.concat(capability.metadata!.appSymbolicName)), // add provider since it is an implicit consumer
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
        mapArray(appSymbolicName => this.getApplication(appSymbolicName)!),
      );
  }

  /**
   * Observable that emits all the capabilities which the given application depends on.
   */
  public observeDependingCapabilities$(appSymbolicName: string): Observable<Capability[]> {
    return this._manifestService.lookupIntentions$({appSymbolicName})
      .pipe(
        mapArray(intention => this.findFulfillingCapabilities$(intention)),
        combineArray(),
        distinctArray(capability => capability.metadata!.id),
      );
  }

  /**
   * Observable that emits all the intentions which the given application fulfills since providing one or more matching capabilities.
   */
  public observeDependentIntentions$(appSymbolicName: string): Observable<Intention[]> {
    return this._manifestService.lookupCapabilities$({appSymbolicName})
      .pipe(
        mapArray(capability => this.findFulfillingIntentions$(capability)),
        combineArray(),
        distinctArray(intention => intention.metadata!.id),
      );
  }

  public capabilityTypes$(): Observable<string[]> {
    return this._manifestService.lookupCapabilities$()
      .pipe(
        mapArray(capability => capability.type),
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
      );
  }

  private findFulfillingIntentions$(capability: Capability): Observable<Intention[]> {
    return this._manifestService.lookupIntentions$({type: capability.type})
      .pipe(
        filterArray(intention => new QualifierMatcher(intention.qualifier).matches(capability.qualifier)),
        filterArray(intention => this.isCapabilityVisibleToApplication(capability, intention.metadata!.appSymbolicName)),
      );
  }

  private findFulfillingCapabilities$(intention: Intention): Observable<Intention[]> {
    return this._manifestService.lookupCapabilities$({type: intention.type, qualifier: intention.qualifier})
      .pipe(filterArray(capability => this.isCapabilityVisibleToApplication(capability, intention.metadata!.appSymbolicName)));
  }

  private isCapabilityVisibleToApplication(capability: Capability, appSymbolicName: string): boolean {
    return !capability.private || this._appsBySymbolicName.get(appSymbolicName)!.scopeCheckDisabled || capability.metadata!.appSymbolicName === appSymbolicName;
  }
}
