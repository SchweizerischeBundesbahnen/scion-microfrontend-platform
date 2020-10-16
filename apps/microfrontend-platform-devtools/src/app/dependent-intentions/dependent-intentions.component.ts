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
import { Application, Intention } from '@scion/microfrontend-platform';
import { Router } from '@angular/router';
import { SciFilterFieldComponent } from '@scion/toolkit.internal/widgets';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { filterCapabilitiesByTypeAndQualifier, filterIntentionsByTypeAndQualifier, splitFilter } from '../filter-utils';
import { DevToolsManifestService } from '../dev-tools-manifest.service';

@Component({
  selector: 'devtools-dependent-intentions',
  templateUrl: './dependent-intentions.component.html',
  styleUrls: ['./dependent-intentions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependentIntentionsComponent implements OnChanges, OnDestroy {

  @Input()
  public appSymbolicName: string;

  @ViewChild(SciFilterFieldComponent)
  private _filterField: SciFilterFieldComponent;
  private _appIntentionMap: Map<Application, Intention[]>;
  private _filter: string[] = [];
  private _updateApp$ = new Subject<void>();
  private _destroy$ = new Subject<void>();

  constructor(manifestService: DevToolsManifestService, private _router: Router, private _cdRef: ChangeDetectorRef) {
    this._updateApp$
      .pipe(
        switchMap(() => manifestService.observeDependentIntentions$(this.appSymbolicName)),
        takeUntil(this._destroy$),
      )
      .subscribe(intentionsByApplication => {
        this._appIntentionMap = intentionsByApplication;
        this._cdRef.markForCheck();
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this._appIntentionMap = new Map<Application, Intention[]>();
    this._filterField && this._filterField.formControl.reset('');
    if (changes['appSymbolicName'] && changes['appSymbolicName'].currentValue) {
      this._updateApp$.next();
    }
  }

  public get applications(): Application[] {
    return Array.from(this._appIntentionMap.keys())
      .filter(app => filterCapabilitiesByTypeAndQualifier(this._appIntentionMap.get(app), this._filter).length)
      .sort(byAppName);
  }

  public intentions(app: Application): Intention[] {
    return filterIntentionsByTypeAndQualifier(this._appIntentionMap.get(app), this._filter);
  }

  public onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  public trackByApplicationFn(index: number, app: Application): string {
    return app.symbolicName;
  }

  public trackByIntentionFn(index: number, intention: Intention): string {
    return intention.metadata.id;
  }

  public onFilterChange(filter: string): void {
    this._filter = splitFilter(filter);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

const byAppName = (app1: Application, app2: Application) => app1.name.localeCompare(app2.name);
