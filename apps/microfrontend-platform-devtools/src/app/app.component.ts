/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener} from '@angular/core';
import {Observable} from 'rxjs';
import {ShellService} from './shell.service';
import {MicrofrontendPlatformClient} from '@scion/microfrontend-platform';
import {AsyncPipe, NgIf} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {SciSashboxModule} from '@scion/components/sashbox';
import {AppMenuComponent} from './app-menu/app-menu.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'devtools-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    RouterOutlet,
    SciSashboxModule,
    AppMenuComponent,
  ],
})
export class AppComponent {

  public showPrimaryOutlet = true;
  public showDetailsOutlet = false;
  public menuOpen = false;
  public readonly connnectedToHost = MicrofrontendPlatformClient.isConnected();

  constructor(private _shellService: ShellService, private _cdRef: ChangeDetectorRef) {
    this.installNavigationEndListener();
  }

  private installNavigationEndListener(): void {
    this._shellService.isDetailsOutletActive$()
      .pipe(takeUntilDestroyed())
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
}
