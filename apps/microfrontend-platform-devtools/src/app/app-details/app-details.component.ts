/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, MonoTypeOperatorFunction, Observable, Subject } from 'rxjs';
import { Application, Capability, Intention } from '@scion/microfrontend-platform';
import { distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { DevToolsManifestService } from '../dev-tools-manifest.service';
import { ActivatedRoute, NavigationEnd, Router, UrlSegmentGroup } from '@angular/router';
import { filterCapabilities, filterIntentions, splitFilter } from '../filter-utils';
import { ShellService } from '../shell.service';
import { SciTabbarComponent } from '@scion/toolkit.internal/widgets';
import { Arrays } from '@scion/toolkit/util';
import { bufferUntil } from '../operators';

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

  public appSymbolicName$: Observable<string>;
  public application$: Observable<Application>;
  public capabilities$: Observable<Capability[]>;
  public intentions$: Observable<Intention[]>;

  private _capabilityFilter$ = new BehaviorSubject<string[]>([]);
  private _intentionFilter$ = new BehaviorSubject<string[]>([]);

  private _tabbar$ = new BehaviorSubject<SciTabbarComponent>(null);
  private _destroy$ = new Subject<void>();

  constructor(private _shellService: ShellService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _manifestService: DevToolsManifestService,
              private _cd: ChangeDetectorRef) {
    this.appSymbolicName$ = this._route.paramMap
      .pipe(
        map(paramMap => paramMap.get('appSymbolicName')),
        distinctUntilChanged(),
      );
    this.application$ = this.observeApplication$();
    this.capabilities$ = this.observeCapabilities$();
    this.intentions$ = this.observeIntentions$();

    this.installTitleProvider();
    this.installTabActivator();
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

  private installTitleProvider(): void {
    this.appSymbolicName$
      .pipe(
        map(appSymbolicName => this._manifestService.application(appSymbolicName)),
        map(application => application?.name),
        takeUntil(this._destroy$),
      )
      .subscribe(appName => {
        this._shellService.detailsTitle = appName;
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
