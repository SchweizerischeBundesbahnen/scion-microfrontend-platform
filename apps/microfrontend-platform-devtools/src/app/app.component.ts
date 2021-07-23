/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {animate, style, transition, trigger} from '@angular/animations';
import {ShellService} from './shell.service';

export function isRunningStandalone(): boolean {
  return window.parent === window;
}

@Component({
  selector: 'devtools-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('openCloseMenu', [
      transition(':enter', [
        style({
          width: '0',
        }),
        animate(100, style({width: '*'})),
      ]),
    ]),
  ],
})
export class AppComponent implements OnDestroy {
  public showPrimaryOutlet = true;
  public showDetailsOutlet = false;
  public menuOpen = false;

  private _destroy$ = new Subject<void>();

  constructor(private _shellService: ShellService, private _cdRef: ChangeDetectorRef) {
    this.installNavigationEndListener();
  }

  private installNavigationEndListener(): void {
    this._shellService.isDetailsOutletActive$()
      .pipe(takeUntil(this._destroy$))
      .subscribe(isDetailsOutletActive => {
        this.showDetailsOutlet = isDetailsOutletActive;

        // Force showing primary outlet if details outlet is deactivated through navigation
        if (!isDetailsOutletActive) {
          this.showPrimaryOutlet = true;
        }

        this._cdRef.markForCheck();
      });
  }

  public get primaryTitle$(): Observable<string> {
    return this._shellService.primaryTitle$;
  }

  public get detailsTitle$(): Observable<string> {
    return this._shellService.detailsTitle$;
  }

  public isRunningInMicrofrontendPlatform(): boolean {
    return !isRunningStandalone();
  }

  public onCollapsePrimaryClick(): void {
    this.showPrimaryOutlet = false;
  }

  public onExpandPrimaryClick(): void {
    this.showPrimaryOutlet = true;
  }

  public onDetailsDblClick(): void {
    this.showPrimaryOutlet = !this.showPrimaryOutlet;
  }

  public onOpenMenuClick(): void {
    this.menuOpen = true;
  }

  @HostListener('document:keydown.escape')
  public onMenuClose(): void {
    this.menuOpen = false;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
