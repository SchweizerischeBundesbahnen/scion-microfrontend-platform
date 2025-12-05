/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {ShellService} from './shell.service';
import {ContextService, MicrofrontendPlatformClient, OUTLET_CONTEXT} from '@scion/microfrontend-platform';
import {AsyncPipe} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {AppMenuComponent} from './app-menu/app-menu.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Beans} from '@scion/toolkit/bean-manager';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterOutlet,
    SciSashboxComponent,
    SciSashDirective,
    AppMenuComponent,
    SciMaterialIconDirective,
  ],
})
export class AppComponent {

  private readonly _shellService = inject(ShellService);
  private readonly _cd = inject(ChangeDetectorRef);

  protected readonly connectedToHost = MicrofrontendPlatformClient.isConnected();

  protected showPrimaryOutlet = true;
  protected showDetailsOutlet = false;
  protected menuOpen = false;

  constructor() {
    this.installNavigationEndListener();
    void this.signalReady();
  }

  /**
   * Signals completed loading if loaded in a router outlet.
   */
  private async signalReady(): Promise<void> {
    if (await Beans.opt(ContextService)?.isPresent(OUTLET_CONTEXT)) {
      MicrofrontendPlatformClient.signalReady();
    }
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

        this._cd.markForCheck();
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
