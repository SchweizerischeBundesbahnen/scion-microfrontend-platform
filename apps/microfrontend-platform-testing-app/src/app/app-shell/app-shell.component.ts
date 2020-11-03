/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { Component, ElementRef, HostBinding, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { ConsoleService } from '../console/console.service';
import { ContextService, FocusMonitor, MicroApplicationConfig, OUTLET_CONTEXT, OutletContext } from '@scion/microfrontend-platform';
import { filter, switchMapTo, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Defined } from '@scion/toolkit/util';
import { Beans } from '@scion/toolkit/bean-manager';

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
  public isConsoleVisible = false;

  constructor(host: ElementRef<HTMLElement>, private _consoleService: ConsoleService) {
    this.appSymbolicName = Beans.get(MicroApplicationConfig).symbolicName;

    this.installFocusWithinListener();
    this.installRouteActivateListener();
    this.installKeyboardEventListener(host);
  }

  private installRouteActivateListener(): void {
    this._routeActivate$
      .pipe(
        switchMapTo(Beans.get(ContextService).observe$<OutletContext>(OUTLET_CONTEXT)),
        takeUntil(this._destroy$),
      )
      .subscribe(outletContext => {
        if (outletContext) {
          this._consoleService.log('onload', `${window.location.href} [app='${this.appSymbolicName}', outlet='${outletContext.name}']`);
        }
        else {
          this._consoleService.log('onload', `${window.location.href} [app='${this.appSymbolicName}']`);
        }
      });
  }

  private installFocusWithinListener(): void {
    Beans.get(FocusMonitor).focusWithin$
      .pipe(takeUntil(this._destroy$))
      .subscribe(isFocusWithin => {
        this.isFocusWithin = isFocusWithin;
      });
  }

  private installKeyboardEventListener(host: ElementRef<HTMLElement>): void {
    merge(fromEvent<KeyboardEvent>(host.nativeElement, 'keydown'), fromEvent<KeyboardEvent>(host.nativeElement, 'keyup'))
      .pipe(
        filter(event => (event.target as Element).tagName === 'SCI-ROUTER-OUTLET'),
        takeUntil(this._destroy$),
      )
      .subscribe(event => {
        this._consoleService.log(event.type, `[key='${event.key}', control=${event.ctrlKey}, shift=${event.shiftKey}, alt=${event.altKey}, meta=${event.metaKey}]`);
      });
  }

  public onRouteActivate(route: ActivatedRoute): void {
    const isPageTitleVisible = Defined.orElse(route.snapshot.data['pageTitleVisible'], true);
    this.pageTitle = isPageTitleVisible ? route.snapshot.data['pageTitle'] : null;
    this._routeActivate$.next();
  }

  public onConsoleToggle(): void {
    this.isConsoleVisible = !this.isConsoleVisible;
  }

  @HostBinding('class.top-window')
  public get isTopWindow(): boolean {
    return window.top === window;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
