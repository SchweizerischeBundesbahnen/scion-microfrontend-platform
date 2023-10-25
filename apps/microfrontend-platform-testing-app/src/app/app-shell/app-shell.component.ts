/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, DestroyRef, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {asapScheduler, debounceTime, delay, EMPTY, from, mergeMap, of, Subject, switchMap, withLatestFrom} from 'rxjs';
import {APP_IDENTITY, ContextService, FocusMonitor, IS_PLATFORM_HOST, ManifestService, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {tap} from 'rxjs/operators';
import {ActivatedRoute, RouterOutlet} from '@angular/router';
import {Defined} from '@scion/toolkit/util';
import {Beans} from '@scion/toolkit/bean-manager';
import {AsyncPipe, NgIf} from '@angular/common';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {SciViewportComponent} from '@scion/components/viewport';
import {DevToolsComponent} from '../devtools/devtools.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    RouterOutlet,
    SciSashboxComponent,
    SciSashDirective,
    SciViewportComponent,
    DevToolsComponent,
  ],
})
export default class AppShellComponent implements OnInit {

  private _routeActivate$ = new Subject<void>();
  private _angularChangeDetectionCycle$ = new Subject<void>();

  public appSymbolicName: string;
  public pageTitle: string | undefined;
  public isDevToolsOpened = false;
  public isDevToolsEnabled: boolean;
  public isPlatformHost = Beans.get<boolean>(IS_PLATFORM_HOST);
  public focusMonitor: FocusMonitor;

  @ViewChild('angular_change_detection_indicator', {static: true})
  private _changeDetectionElement!: ElementRef<HTMLElement>;

  constructor(private _zone: NgZone, private _destroyRef: DestroyRef) {
    this.appSymbolicName = Beans.get<string>(APP_IDENTITY);
    this.focusMonitor = Beans.get(FocusMonitor);

    this.installRouteActivateListener();
    this.installKeystrokeRegisterLogger();
    this.isDevToolsEnabled = this.isPlatformHost && Beans.get(ManifestService).applications.some(app => app.symbolicName === 'devtools');
  }

  public ngOnInit(): void {
    this.installAngularChangeDetectionIndicator();
  }

  private installRouteActivateListener(): void {
    this._routeActivate$
      .pipe(
        switchMap(() => Beans.get(ContextService).observe$<OutletContext>(OUTLET_CONTEXT)),
        takeUntilDestroyed(),
      )
      .subscribe(outletContext => {
        const context = outletContext?.name ?? 'n/a';
        console.debug(`[AppShellComponent::router-outlet:onactivate] [app=${this.appSymbolicName}, location=${window.location.href}, outletContext=${context}]]`);
      });
  }

  /**
   * Logs when a keystroke is to be installed in this app instance.
   */
  private installKeystrokeRegisterLogger(): void {
    const outletName$ = Beans.get(ContextService).observe$<OutletContext>(OUTLET_CONTEXT)
      .pipe(mergeMap(context => context ? of(context.name) : EMPTY));

    // TODO [#207]: Use API to get notified when keystrokes are installed: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/207
    Beans.get(ContextService).names$()
      .pipe(
        mergeMap(contextKeys => from(Array.from(contextKeys).filter(key => key.startsWith('keystroke:')))),
        delay(250), // Wait some time for the keystroke to be installed
        withLatestFrom(outletName$),
        takeUntilDestroyed(),
      )
      .subscribe(([keystroke, outletName]) => {
        console.debug(`[AppShellComponent::${keystroke}][app=${this.appSymbolicName}][location=${window.location.href}][outlet=${outletName}]`);
      });
  }

  private installAngularChangeDetectionIndicator(): void {
    this._angularChangeDetectionCycle$
      .pipe(
        tap(() => NgZone.assertNotInAngularZone()),
        tap(() => this._changeDetectionElement.nativeElement.classList.add('active')),
        debounceTime(500),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this._changeDetectionElement.nativeElement.classList.remove('active');
      });
  }

  /**
   * asapScheduler is used in order to avoid 'ExpressionChangedAfterItHasBeenCheckedError'.
   *
   * For some reason, if the router-outlet is placed inside a container with some structural directive,
   * the change detection gets somewhat messed up, resulting in the mentioned error.
   *
   * Example 1:
   * <ng-container *ngIf="...">
   *   <router-outlet #outlet=outlet (activate)="onRouteActivate(outlet.activatedRoute)"></router-outlet>
   * </ng-container>
   *
   * Example 2:
   * <ng-container *ngTemplateOutlet="template"></ng-container>
   * <ng-template #template>
   *   <router-outlet #outlet=outlet (activate)="onRouteActivate(outlet.activatedRoute)"></router-outlet>
   * </ng-template>
   */
  public onRouteActivate(route: ActivatedRoute): void {
    const isPageTitleVisible = Defined.orElse(route.snapshot.data['pageTitleVisible'], true);
    asapScheduler.schedule(() => this.pageTitle = isPageTitleVisible ? route.snapshot.data['pageTitle'] : null);
    this._routeActivate$.next();
  }


  public onDevToolsToggle(): void {
    this.isDevToolsOpened = !this.isDevToolsOpened;
  }

  /**
   * Method invoked on each Angular change detection cycle.
   */
  public get onAngularChangeDetectionCycle(): void {
    this._zone.runOutsideAngular(() => this._angularChangeDetectionCycle$.next());
    return undefined as void;
  }
}
