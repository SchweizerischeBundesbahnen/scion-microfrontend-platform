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
import {BehaviorSubject, MonoTypeOperatorFunction, Observable, Subject} from 'rxjs';
import {Application, Capability, Intention} from '@scion/microfrontend-platform';
import {distinctUntilChanged, expand, filter, map, mapTo, switchMap, take, takeUntil} from 'rxjs/operators';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {ActivatedRoute, NavigationEnd, Router, UrlSegmentGroup} from '@angular/router';
import {filterManifestObjects} from '../manifest-object-filter.utils';
import {ShellService} from '../shell.service';
import {FormControl} from '@angular/forms';
import {SciTabbarComponent} from '@scion/toolkit.internal/widgets';
import {Arrays} from '@scion/toolkit/util';
import {bufferUntil} from '@scion/toolkit/operators';

/**
 * Instruction passed with a navigation to specify the tab to be activated.
 */
export const ACTIVE_TAB_ROUTER_STATE = 'activeTab';

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

  public capabilityFilterFormControl = new FormControl();
  public intentionFilterFormControl = new FormControl();

  private _tabbar$ = new BehaviorSubject<SciTabbarComponent>(null);
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
        expand(capabilities => this.capabilityFilterFormControl.valueChanges.pipe(take(1), mapTo(capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.capabilityFilterFormControl.value)),
      );
  }

  private observeIntentions$(): Observable<Intention[]> {
    return this.application$
      .pipe(
        switchMap(application => this._manifestService.intentions$({appSymbolicName: application.symbolicName})),
        expand(intentions => this.intentionFilterFormControl.valueChanges.pipe(take(1), mapTo(intentions))),
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
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        matchesRoute(this._router, this._route),
        map(() => this._router.getCurrentNavigation()?.extras.state?.[ACTIVE_TAB_ROUTER_STATE] as string),
        bufferUntil(this._tabbar$.pipe(filter(Boolean))),
        takeUntil(this._destroy$),
      )
      .subscribe((tabToActivate: string | undefined) => {
        if (tabToActivate) {
          this._tabbar$.value.activateTab(tabToActivate);
          this._cd.markForCheck();
        }
      });
  }

  @ViewChild(SciTabbarComponent)
  public set injectTabbar(tabbar: SciTabbarComponent) {
    this._tabbar$.next(tabbar);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Filters {@link NavigationEnd} events matching the given route.
 */
function matchesRoute(router: Router, route: ActivatedRoute): MonoTypeOperatorFunction<NavigationEnd> {
  return filter((navigationEnd: NavigationEnd): boolean => {
    const rootUrlSegmentGroup = router.parseUrl(navigationEnd.url).root;

    let urlSegmentGroupUnderTest: UrlSegmentGroup = null;
    return route.snapshot.pathFromRoot.every(activatedRoute => {
      urlSegmentGroupUnderTest = urlSegmentGroupUnderTest ? urlSegmentGroupUnderTest.children[activatedRoute.outlet] : rootUrlSegmentGroup;
      return Arrays.isEqual(activatedRoute.url.map(segment => segment.toString()), urlSegmentGroupUnderTest.segments.map(segment => segment.toString()));
    });
  });
}
