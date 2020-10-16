/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { Application, Capability, Intention } from '@scion/microfrontend-platform';
import { distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';
import { DevToolsManifestService } from '../dev-tools-manifest.service';
import { ActivatedRoute } from '@angular/router';
import { filterCapabilities, filterIntentions, splitFilter } from '../filter-utils';
import { ShellService } from '../shell.service';

@Component({
  selector: 'devtools-app-details',
  templateUrl: './app-details.component.html',
  styleUrls: ['./app-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsComponent implements OnDestroy {

  public appSymbolicName$: Observable<string>;
  public application$: Observable<Application>;
  public capabilities$: Observable<Capability[]>;
  public intentions$: Observable<Intention[]>;

  private _capabilityFilter$ = new BehaviorSubject<string[]>([]);
  private _intentionFilter$ = new BehaviorSubject<string[]>([]);
  private _destroy$ = new Subject<void>();

  constructor(private _shellService: ShellService, route: ActivatedRoute, private _manifestService: DevToolsManifestService) {
    this.appSymbolicName$ = route.paramMap
      .pipe(
        map(paramMap => paramMap.get('appSymbolicName')),
        distinctUntilChanged(),
      );
    this.installTitleProvider();
    this.application$ = this.observeApplication$();
    this.capabilities$ = this.observeCapabilities$();
    this.intentions$ = this.observeIntentions$();
  }

  private installTitleProvider(): void {
    this.appSymbolicName$
      .pipe(
        map(appSymbolicName => this._manifestService.application(appSymbolicName)),
        map(application => application?.name),
        takeUntil(this._destroy$),
      )
      .subscribe(appName => this._shellService.detailsTitle = appName);
  }

  private observeApplication$(): Observable<Application> {
    return this.appSymbolicName$
      .pipe(map(appSymbolicName => this._manifestService.application(appSymbolicName)));
  }

  private observeCapabilities$(): Observable<Capability[]> {
    return this.appSymbolicName$
      .pipe(
        switchMap(appSymbolicName => combineLatest([
          this._manifestService.capabilities$({appSymbolicName}),
          this._capabilityFilter$,
        ])),
        filterCapabilities(),
      );
  }

  private observeIntentions$(): Observable<Intention[]> {
    return this.appSymbolicName$
      .pipe(
        switchMap(appSymbolicName => combineLatest([
          this._manifestService.intentions$({appSymbolicName}),
          this._intentionFilter$,
        ])),
        filterIntentions(),
      );
  }

  public onCapabilityFilter(filter: string): void {
    this._capabilityFilter$.next(splitFilter(filter));
  }

  public onIntentionFilter(filter: string): void {
    this._intentionFilter$.next(splitFilter(filter));
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
