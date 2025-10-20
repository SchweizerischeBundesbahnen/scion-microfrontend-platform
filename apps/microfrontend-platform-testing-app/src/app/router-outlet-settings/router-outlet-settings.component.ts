/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, HostListener, inject, Injector} from '@angular/core';
import {PreferredSize, SciRouterOutletElement} from '@scion/microfrontend-platform';
import {ConnectedPosition, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {JsonPipe} from '@angular/common';
import {CdkTrapFocus} from '@angular/cdk/a11y';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciToggleButtonComponent} from '@scion/components.internal/toggle-button';
import {FormControl, ReactiveFormsModule} from '@angular/forms';

const OVERLAY_POSITION_SOUTH: ConnectedPosition = {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'};

@Component({
  selector: 'app-router-outlet-settings',
  templateUrl: './router-outlet-settings.component.html',
  styleUrls: ['./router-outlet-settings.component.scss'],
  imports: [
    JsonPipe,
    CdkTrapFocus,
    ReactiveFormsModule,
    SciToggleButtonComponent,
  ],
})
export class RouterOutletSettingsComponent {

  private readonly _routerOutlet = inject(SciRouterOutletElement);
  private readonly _overlay = inject(OverlayRef);

  protected readonly pageScrollingEnabledFormControl: FormControl<boolean>;

  constructor() {
    this.pageScrollingEnabledFormControl = new FormControl<boolean>(this._routerOutlet.scrollable, {nonNullable: true});
    this.pageScrollingEnabledFormControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(on => this._routerOutlet.scrollable = on);
    this._overlay.backdropClick()
      .pipe(takeUntilDestroyed())
      .subscribe(() => this._overlay.dispose());
  }

  public onPreferredSizeResetClick(): void {
    this._routerOutlet.resetPreferredSize();
  }

  public get preferredSize(): PreferredSize | undefined {
    const preferredSize = this._routerOutlet.preferredSize;
    if (!preferredSize) {
      return undefined;
    }

    // Remove properties which are not set.
    return Object.keys(preferredSize).reduce((obj, key) => {
      if (preferredSize[key as keyof PreferredSize] !== undefined) {
        return {...obj, [key]: preferredSize[key as keyof PreferredSize]};
      }
      return obj;
    }, {});
  }

  @HostListener('keydown.escape')
  public onEscape(): void {
    this._overlay.dispose();
  }

  public static openAsOverlay(config: {anchor: HTMLElement; routerOutlet: SciRouterOutletElement; overlay: Overlay; injector: Injector}): void {
    const {anchor, routerOutlet, overlay, injector} = config;

    const positionStrategy = overlay.position()
      .flexibleConnectedTo(anchor)
      .withFlexibleDimensions(false)
      .withPositions([OVERLAY_POSITION_SOUTH]);

    const overlayConfig = new OverlayConfig({
      panelClass: 'e2e-router-outlet-settings-overlay',
      hasBackdrop: true,
      positionStrategy: positionStrategy,
      scrollStrategy: overlay.scrollStrategies.noop(),
      disposeOnNavigation: true,
      width: 350,
      backdropClass: 'transparent-backdrop',
    });

    const overlayRef = overlay.create(overlayConfig);
    const portal = new ComponentPortal(RouterOutletSettingsComponent, null, Injector.create({
      parent: injector,
      providers: [
        {provide: OverlayRef, useValue: overlayRef},
        {provide: SciRouterOutletElement, useValue: routerOutlet},
      ],
    }));
    overlayRef.attach(portal);
  }
}
