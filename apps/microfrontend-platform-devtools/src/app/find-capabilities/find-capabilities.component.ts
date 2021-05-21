/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KeyValuePair, LogicalOperator } from './filter-field/filter-field';
import { CapabilityFilterSession } from './capability-filter-session.service';
import { Observable } from 'rxjs';
import { DevToolsManifestService } from '../dev-tools-manifest.service';
import { ShellService } from '../shell.service';
import { map } from 'rxjs/operators';
import { distinctArray } from '../operators';
import { sortArray } from '@scion/toolkit/operators';

@Component({
  selector: 'devtools-find-capabilities',
  templateUrl: './find-capabilities.component.html',
  styleUrls: ['./find-capabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindCapabilitiesComponent {

  public capabilityTypes$: Observable<string[]>;
  public appSymbolicNames: string[];
  public qualifierKeys$: Observable<string[]>;
  public qualifierValues$: Observable<string[]>;

  constructor(shellService: ShellService, public capabilityFilterSession: CapabilityFilterSession, manifestService: DevToolsManifestService) {
    shellService.primaryTitle = 'Filter';
    this.capabilityTypes$ = manifestService.capabilityTypes$();
    this.appSymbolicNames = manifestService.applications.map(app => app.symbolicName).sort();
    this.qualifierKeys$ = manifestService.capabilities$()
      .pipe(
        map(capabilities => capabilities.reduce((acc, capability) => acc.concat(Object.keys(capability.qualifier || {})), [])),
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
      );
    this.qualifierValues$ = manifestService.capabilities$()
      .pipe(
        map(capabilities => capabilities.reduce((acc, capability) => acc.concat(Object.values(capability.qualifier || {})), [])),
        distinctArray(),
        sortArray((a, b) => a.localeCompare(b)),
      );
  }

  public onTypeFilterAdd(type: string): void {
    this.capabilityFilterSession.addTypeFilter(type);
  }

  public onTypeFilterRemove(type: string): void {
    this.capabilityFilterSession.removeTypeFilter(type);
  }

  public get typeFilters(): string[] {
    return this.capabilityFilterSession.typeFilters;
  }

  public onQualifierFilterAdd(qualifier: KeyValuePair): void {
    this.capabilityFilterSession.addQualifierFilter(qualifier);
  }

  public onQualifierFilterRemove(qualifier: KeyValuePair): void {
    this.capabilityFilterSession.removeQualifierFilter(qualifier);
  }

  public get qualifierFilters(): KeyValuePair[] {
    return this.capabilityFilterSession.qualifierFilters;
  }

  public onAppFilterAdd(app: string): void {
    this.capabilityFilterSession.addAppFilter(app);
  }

  public onAppFilterRemove(app: string): void {
    this.capabilityFilterSession.removeAppFilter(app);
  }

  public get appFilters(): string[] {
    return this.capabilityFilterSession.appFilters;
  }

  public onTypeLogicalOperatorChange(logicalOperator: LogicalOperator): void {
    this.capabilityFilterSession.typeLogicalOperator = logicalOperator;
  }

  public onQualifierLogicalOperatorChange(logicalOperator: LogicalOperator): void {
    this.capabilityFilterSession.qualifierLogicalOperator = logicalOperator;
  }

  public onAppLogicalOperatorChange(logicalOperator: LogicalOperator): void {
    this.capabilityFilterSession.appLogicalOperator = logicalOperator;
  }
}
