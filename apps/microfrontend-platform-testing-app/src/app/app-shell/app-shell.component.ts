/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, effect, ElementRef, inject, NgZone, untracked, viewChild} from '@angular/core';
import {asapScheduler, debounceTime, delay, EMPTY, from, mergeMap, of, Subject, switchMap, withLatestFrom} from 'rxjs';
import {APP_IDENTITY, ContextService, FocusMonitor, IS_PLATFORM_HOST, ManifestService, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {tap} from 'rxjs/operators';
import {ActivatedRoute, RouterOutlet} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {AsyncPipe} from '@angular/common';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {SciViewportComponent} from '@scion/components/viewport';
import {DevToolsComponent} from '../devtools/devtools.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciToggleButtonComponent} from '@scion/components.internal/toggle-button';
import {FormControl, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  imports: [
    AsyncPipe,
    RouterOutlet,
    SciSashboxComponent,
    SciSashDirective,
    SciViewportComponent,
    DevToolsComponent,
    SciToggleButtonComponent,
    ReactiveFormsModule,
  ],
})
export default class AppShellComponent {

  private readonly _zone = inject(NgZone);
  private readonly _changeDetectionElement = viewChild.required<ElementRef<HTMLElement>>('angular_change_detection_indicator');
  private readonly _routeActivate$ = new Subject<void>();
  private readonly _angularChangeDetectionCycle$ = new Subject<void>();

  protected readonly isPlatformHost = Beans.get<boolean>(IS_PLATFORM_HOST);
  protected readonly appSymbolicName = Beans.get<string>(APP_IDENTITY);
  protected readonly focusMonitor = Beans.get(FocusMonitor);
  protected readonly devToolsFormControl = new FormControl<boolean>(false, {nonNullable: true});

  protected pageTitle: string | undefined;

  constructor() {
    this.installRouteActivateListener();
    this.installKeystrokeRegisterLogger();
    this.installAngularChangeDetectionIndicator();

    if (!this.isPlatformHost || !Beans.get(ManifestService).applications.some(app => app.symbolicName === 'devtools')) {
      this.devToolsFormControl.disable();
    }
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
    effect(onCleanup => {
      const changeDetectionElement = this._changeDetectionElement().nativeElement;

      untracked(() => {
        const subscription = this._angularChangeDetectionCycle$
          .pipe(
            tap(() => NgZone.assertNotInAngularZone()),
            tap(() => changeDetectionElement.classList.add('active')),
            debounceTime(500),
          )
          .subscribe(() => changeDetectionElement.classList.remove('active'));

        onCleanup(() => subscription.unsubscribe());
      });
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
  protected onRouteActivate(route: ActivatedRoute): void {
    const isPageTitleVisible = route.snapshot.data['pageTitleVisible'] as boolean | undefined ?? true;
    asapScheduler.schedule(() => this.pageTitle = isPageTitleVisible ? route.snapshot.data['pageTitle'] as string : undefined);
    this._routeActivate$.next();
  }

  /**
   * Method invoked on each Angular change detection cycle.
   */
  protected get onAngularChangeDetectionCycle(): void {
    this._zone.runOutsideAngular(() => this._angularChangeDetectionCycle$.next());
    return undefined as void;
  }
}
