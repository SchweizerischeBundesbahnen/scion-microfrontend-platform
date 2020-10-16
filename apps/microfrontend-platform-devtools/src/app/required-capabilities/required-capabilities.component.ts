/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Application, Capability, Intention } from '@scion/microfrontend-platform';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { SciFilterFieldComponent } from '@scion/toolkit.internal/widgets';
import { filterCapabilitiesByTypeAndQualifier, splitFilter } from '../filter-utils';
import { DevToolsManifestService } from '../dev-tools-manifest.service';

@Component({
  selector: 'devtools-required-capabilities',
  templateUrl: './required-capabilities.component.html',
  styleUrls: ['./required-capabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequiredCapabilitiesComponent implements OnChanges, OnDestroy {

  @Input()
  public appSymbolicName: string;
  public selectedCapability: Capability;

  @ViewChild(SciFilterFieldComponent)
  private _filterField: SciFilterFieldComponent;
  private _appCapabilityMap: Map<Application, Capability[]>;
  private _filter: string[] = [];
  private _updateApp$ = new Subject<void>();
  private _destroy$ = new Subject<void>();

  constructor(manifestService: DevToolsManifestService, private _router: Router, private _cdRef: ChangeDetectorRef) {
    this._updateApp$
      .pipe(
        switchMap(() => manifestService.observeRequiredCapabilities$(this.appSymbolicName)),
        takeUntil(this._destroy$),
      )
      .subscribe(capabilitiesByApplication => {
        this._appCapabilityMap = capabilitiesByApplication;
        this._cdRef.markForCheck();
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this._appCapabilityMap = new Map<Application, Intention[]>();
    this.selectedCapability = null;
    this._filterField && this._filterField.formControl.reset('');
    this._updateApp$.next();
  }

  public get applications(): Application[] {
    return Array.from(this._appCapabilityMap.keys())
      .filter(app => filterCapabilitiesByTypeAndQualifier(this._appCapabilityMap.get(app), this._filter).length)
      .sort(byAppName);
  }

  public capabilities(app: Application): Capability[] {
    return filterCapabilitiesByTypeAndQualifier(this._appCapabilityMap.get(app), this._filter);
  }

  public onClick(capability: Capability): void {
    if (this.selectedCapability === capability) {
      this.selectedCapability = null;
    }
    else {
      this.selectedCapability = capability;
    }
  }

  public onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  public onAccordionItemClick(): void {
    this.selectedCapability = null;
  }

  public trackByApplicationFn(index: number, application: Application): string {
    return application.symbolicName;
  }

  public trackByCapabilityFn(index: number, capability: Capability): string {
    return capability.metadata.id;
  }

  public onFilterChange(filter: string): void {
    this._filter = splitFilter(filter);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

const byAppName = (app1: Application, app2: Application) => app1.name.localeCompare(app2.name);
