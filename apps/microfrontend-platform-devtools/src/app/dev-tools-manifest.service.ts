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
import { combineLatest, MonoTypeOperatorFunction, Observable, of, OperatorFunction, pipe } from 'rxjs';
import { Application, Capability, Intention, ManifestObject, ManifestObjectFilter, ManifestService } from '@scion/microfrontend-platform';
import { map, switchMap } from 'rxjs/operators';
import { filterArray, mapArray, sortArray } from '@scion/toolkit/operators';

@Injectable({
  providedIn: 'root',
})
export class DevToolsManifestService {

  public readonly applications: ReadonlyArray<Application>;
  private readonly _appsBySymbolicName: Map<string, Application>;

  constructor(private _manifestService: ManifestService) {
    this.applications = this._manifestService.applications;
    this._appsBySymbolicName = new Map<string, Application>(this.applications.map(app => [app.symbolicName, app]));
  }

  public application(appSymbolicName: string): Application {
    return this._appsBySymbolicName.get(appSymbolicName);
  }

  public intentions$(filter: ManifestObjectFilter): Observable<Intention[]> {
    return this._manifestService.lookupIntentions$(filter)
      .pipe(sortArray(byType));
  }

  public capabilities$(filter?: ManifestObjectFilter): Observable<Capability[]> {
    return this._manifestService.lookupCapabilities$(filter)
      .pipe(sortArray(byType));
  }

  public capabilityProviders$(intention: Intention): Observable<Application[]> {
    const capabilityFilter = {
      type: intention.type,
      qualifier: intention.qualifier || {},
    };

    return this._manifestService.lookupCapabilities$(capabilityFilter)
      .pipe(this.mapApplications());
  }

  public capabilityConsumers$(capability: Capability): Observable<Application[]> {
    const intentionFilter = {
      type: capability.type,
      qualifier: capability.qualifier || {},
    };

    return this._manifestService.lookupIntentions$(intentionFilter)
      .pipe(this.mapApplications());
  }

  public observeRequiredCapabilities$(appSymbolicName: string): Observable<Map<Application, Capability[]>> {
    return this._manifestService.lookupIntentions$({appSymbolicName})
      .pipe(
        this.lookupMatchingCapabilities(),
        filterArray(capability => capability.metadata.appSymbolicName !== appSymbolicName),
        this.groupByApplication(),
      );
  }

  public observeDependentIntentions$(appSymbolicName: string): Observable<Map<Application, Intention[]>> {
    return this._manifestService.lookupCapabilities$({appSymbolicName})
      .pipe(
        this.lookupMatchingIntentions(),
        filterArray(intention => intention.metadata.appSymbolicName !== appSymbolicName),
        this.groupByApplication(),
      );
  }

  public capabilityTypes$(): Observable<string[]> {
    return this.capabilities$()
      .pipe(
        mapArray(capability => capability.type),
        map(capabilityTypes => [...new Set(capabilityTypes)]),
        sortArray(asciiAscending),
      );
  }

  private mapApplications(): OperatorFunction<ManifestObject[], Application[]> {
    return pipe(
      distinctAppSymbolicNames(),
      mapArray(appSymbolicName => this._appsBySymbolicName.get(appSymbolicName)),
      sortArray(bySymbolicName),
    );
  }

  private lookupMatchingCapabilities(): MonoTypeOperatorFunction<ManifestObject[]> {
    return lookupMatchingManifestObjects(manifestObject => this._manifestService.lookupCapabilities$({
      type: manifestObject.type,
      qualifier: manifestObject.qualifier || {},
    }));
  }

  private lookupMatchingIntentions(): MonoTypeOperatorFunction<ManifestObject[]> {
    return lookupMatchingManifestObjects(manifestObject => this._manifestService.lookupIntentions$({
      type: manifestObject.type,
      qualifier: manifestObject.qualifier || {},
    }));
  }

  private groupByApplication(): OperatorFunction<ManifestObject[], Map<Application, ManifestObject[]>> {
    return pipe(
      map(manifestObjects => manifestObjects
        .reduce((manifestObjectsByApp, manifestObject) => {
          const app = this._appsBySymbolicName.get(manifestObject.metadata.appSymbolicName);
          return manifestObjectsByApp.set(app, [...(manifestObjectsByApp.get(app) || []), manifestObject]);
        }, new Map<Application, ManifestObject[]>()),
      ),
    );
  }
}

function distinctAppSymbolicNames(): OperatorFunction<ManifestObject[], string[]> {
  return pipe(
    mapArray(manifestObject => manifestObject.metadata.appSymbolicName),
    map(appSymbolicNames => [...new Set(appSymbolicNames)]),
  );
}

function lookupMatchingManifestObjects(projectFn: (manifestObject: ManifestObject) => Observable<ManifestObject[]>): MonoTypeOperatorFunction<ManifestObject[]> {
  return pipe(
    switchMap(manifestObjects => manifestObjects.length ? combineLatest(manifestObjects.map(manifestObject => projectFn(manifestObject))) : of([])),
    distinctManifestObjects(),
  );
}

function distinctManifestObjects(): OperatorFunction<ManifestObject[][], ManifestObject[]> {
  return pipe(
    map(nestedManifestObjects => [].concat(...nestedManifestObjects)),
    map(manifestObjects => manifestObjects.reduce((manifestObjectsById, manifestObject) => manifestObjectsById.set(manifestObject.metadata.id, manifestObject), new Map<string, ManifestObject>())),
    map(manifestObjects => Array.from(manifestObjects.values())),
  );
}

const asciiAscending = (str1: string, str2: string): number => str1.localeCompare(str2);
const bySymbolicName = (app1: Application, app2: Application): number => app1.symbolicName.localeCompare(app2.symbolicName);
const byType = (mo1: ManifestObject, mo2: ManifestObject): number => mo1.type.localeCompare(mo2.type);


