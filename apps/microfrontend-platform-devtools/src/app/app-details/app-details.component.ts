/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild} from '@angular/core';
import {combineLatestWith, Observable, Subject} from 'rxjs';
import {Application, Capability, Intention} from '@scion/microfrontend-platform';
import {distinctUntilChanged, expand, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filterManifestObjects} from '../manifest-object-filter.utils';
import {ShellService} from '../shell.service';
import {UntypedFormControl} from '@angular/forms';
import {SciTabbarComponent} from '@scion/components.internal/tabbar';

@Component({
  selector: 'devtools-app-details',
  templateUrl: './app-details.component.html',
  styleUrls: ['./app-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsComponent implements OnDestroy {

  public application$: Observable<Application>;
  public capabilities$: Observable<Capability[]>;
  public intentions$: Observable<Intention[]>;

  public capabilityFilterFormControl = new UntypedFormControl();
  public intentionFilterFormControl = new UntypedFormControl();

  private _tabbar$ = new Subject<SciTabbarComponent>();
  private _destroy$ = new Subject<void>();

  constructor(private _shellService: ShellService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _manifestService: DevToolsManifestService,
              private _cd: ChangeDetectorRef) {
    this.application$ = this.observeApplication$();
    this.capabilities$ = this.observeCapabilities$();
    this.intentions$ = this.observeIntentions$();

    this.installTitleProvider();
    this.installTabActivator();
  }

  private observeApplication$(): Observable<Application> {
    return this._route.paramMap
      .pipe(
        map(paramMap => paramMap.get('appSymbolicName')),
        distinctUntilChanged(),
        map(appSymbolicName => this._manifestService.getApplication(appSymbolicName)),
      );
  }

  private observeCapabilities$(): Observable<Capability[]> {
    return this.application$
      .pipe(
        switchMap(application => this._manifestService.capabilities$({appSymbolicName: application.symbolicName})),
        expand(capabilities => this.capabilityFilterFormControl.valueChanges.pipe(take(1), map(() => capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.capabilityFilterFormControl.value)),
      );
  }

  private observeIntentions$(): Observable<Intention[]> {
    return this.application$
      .pipe(
        switchMap(application => this._manifestService.intentions$({appSymbolicName: application.symbolicName})),
        expand(intentions => this.intentionFilterFormControl.valueChanges.pipe(take(1), map(() => intentions))),
        map(intentions => filterManifestObjects(intentions, this.intentionFilterFormControl.value)),
      );
  }

  private installTitleProvider(): void {
    this.application$
      .pipe(takeUntil(this._destroy$))
      .subscribe(application => {
        this._shellService.detailsTitle = application.name;
        this._cd.markForCheck();
      });
  }

  private installTabActivator(): void {
    this._route.paramMap
      .pipe(
        map(params => params.get('activeTab')), // read 'activeTab' matrix param from URL
        combineLatestWith(this._tabbar$), // wait for tabbar
        takeUntil(this._destroy$),
      )
      .subscribe(([tabToActivate, tabbar]) => {
        if (tabToActivate) {
          this._router.navigate([], {replaceUrl: true, relativeTo: this._route}).then(); // remove 'activeTab' matrix param from URL
          tabbar.activateTab(tabToActivate);
          this._cd.markForCheck();
        }
      });
  }

  @ViewChild(SciTabbarComponent)
  public set injectTabbar(tabbar: SciTabbarComponent) {
    if (tabbar) {
      this._tabbar$.next(tabbar);
      this._tabbar$.complete();
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
