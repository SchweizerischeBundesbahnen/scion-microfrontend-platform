/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, HostBinding, OnDestroy} from '@angular/core';
import {asapScheduler, delay, EMPTY, from, mergeMap, of, Subject, switchMap, withLatestFrom} from 'rxjs';
import {APP_IDENTITY, ContextService, FocusMonitor, IS_PLATFORM_HOST, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {takeUntil} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {Defined} from '@scion/toolkit/util';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements OnDestroy {

  private _destroy$ = new Subject<void>();
  private _routeActivate$ = new Subject<void>();
  public appSymbolicName: string;
  public pageTitle: string;
  public isFocusWithin: boolean;
  public isDevToolsOpened = false;
  public isPlatformHost = Beans.get<boolean>(IS_PLATFORM_HOST);

  constructor() {
    this.appSymbolicName = Beans.get<string>(APP_IDENTITY);

    this.installFocusWithinListener();
    this.installRouteActivateListener();
    this.installKeystrokeRegisterLogger();
  }

  private installRouteActivateListener(): void {
    this._routeActivate$
      .pipe(
        switchMap(() => Beans.get(ContextService).observe$<OutletContext>(OUTLET_CONTEXT)),
        takeUntil(this._destroy$),
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

    Beans.get(ContextService).names$()
      .pipe(
        mergeMap(contextKeys => from(Array.from(contextKeys).filter(key => key.startsWith('keystroke:')))),
        delay(250), // Wait some time for the keystroke to be installed
        withLatestFrom(outletName$),
        takeUntil(this._destroy$),
      )
      .subscribe(([keystroke, outletName]) => {
        console.debug(`[AppShellComponent::${keystroke}][app=${this.appSymbolicName}][location=${window.location.href}][outlet=${outletName}]`);
      });
  }

  private installFocusWithinListener(): void {
    Beans.get(FocusMonitor).focusWithin$
      .pipe(takeUntil(this._destroy$))
      .subscribe(isFocusWithin => {
        this.isFocusWithin = isFocusWithin;
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

  @HostBinding('class.e2e-devtools-enabled')
  public get isDevtoolsEnabled(): boolean {
    return this.isPlatformHost && environment.devtools !== null;
  }

  public onDevToolsToggle(): void {
    this.isDevToolsOpened = !this.isDevToolsOpened;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
