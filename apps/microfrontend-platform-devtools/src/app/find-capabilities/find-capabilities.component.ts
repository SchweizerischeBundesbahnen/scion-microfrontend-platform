/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {KeyValuePair, LogicalOperator} from './filter-field/filter-field';
import {CapabilityFilterSession} from './capability-filter-session.service';
import {Observable} from 'rxjs';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {ShellService} from '../shell.service';
import {map} from 'rxjs/operators';
import {distinctArray, mapArray, sortArray} from '@scion/toolkit/operators';
import {SciViewportComponent} from '@scion/components/viewport';
import {FilterFieldComponent} from './filter-field/filter-field.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'devtools-find-capabilities',
  templateUrl: './find-capabilities.component.html',
  styleUrls: ['./find-capabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    SciViewportComponent,
    FilterFieldComponent,
  ],
})
export default class FindCapabilitiesComponent {

  protected readonly capabilityFilterSession = inject(CapabilityFilterSession);
  protected readonly capabilityIds$: Observable<string[]>;
  protected readonly capabilityTypes$: Observable<string[]>;
  protected readonly appSymbolicNames: string[];
  protected readonly qualifierKeys$: Observable<string[]>;
  protected readonly qualifierValues$: Observable<string[]>;

  constructor(shellService: ShellService, manifestService: DevToolsManifestService) {
    shellService.primaryTitle = 'Capability Browser';
    this.capabilityIds$ = manifestService.capabilities$().pipe(mapArray(capability => capability.metadata!.id));
    this.capabilityTypes$ = manifestService.capabilityTypes$();
    this.appSymbolicNames = manifestService.applications.map(app => app.symbolicName).sort();
    this.qualifierKeys$ = manifestService.capabilities$()
      .pipe(
        map(capabilities => capabilities.reduce((acc, capability) => acc.concat(Object.keys(capability.qualifier || {})), new Array<string>())),
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
      );
    this.qualifierValues$ = manifestService.capabilities$()
      .pipe(
        map(capabilities => capabilities.reduce((acc, capability) => acc.concat(Object.values(capability.qualifier || {}) as Array<string>), new Array<string>())),
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
      );
  }

  protected onIdFilterAdd(id: string): void {
    this.capabilityFilterSession.addIdFilter(id);
  }

  protected onIdFilterRemove(type: string): void {
    this.capabilityFilterSession.removeIdFilter(type);
  }

  protected get idFilters(): string[] {
    return this.capabilityFilterSession.idFilters;
  }

  protected onTypeFilterAdd(type: string): void {
    this.capabilityFilterSession.addTypeFilter(type);
  }

  protected onTypeFilterRemove(type: string): void {
    this.capabilityFilterSession.removeTypeFilter(type);
  }

  protected get typeFilters(): string[] {
    return this.capabilityFilterSession.typeFilters;
  }

  protected onQualifierFilterAdd(qualifier: KeyValuePair): void {
    this.capabilityFilterSession.addQualifierFilter(qualifier);
  }

  protected onQualifierFilterRemove(qualifier: KeyValuePair): void {
    this.capabilityFilterSession.removeQualifierFilter(qualifier);
  }

  protected get qualifierFilters(): KeyValuePair[] {
    return this.capabilityFilterSession.qualifierFilters;
  }

  protected onAppFilterAdd(app: string): void {
    this.capabilityFilterSession.addAppFilter(app);
  }

  protected onAppFilterRemove(app: string): void {
    this.capabilityFilterSession.removeAppFilter(app);
  }

  protected get appFilters(): string[] {
    return this.capabilityFilterSession.appFilters;
  }

  protected onQualifierLogicalOperatorChange(logicalOperator: LogicalOperator): void {
    this.capabilityFilterSession.qualifierLogicalOperator = logicalOperator;
  }
}
