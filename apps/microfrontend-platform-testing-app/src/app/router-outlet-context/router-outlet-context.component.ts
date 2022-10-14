/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, ElementRef, HostListener, Injector, OnDestroy} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {SciRouterOutletElement} from '@scion/microfrontend-platform';
import {ConnectedPosition, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

export const NAME = 'name';
export const VALUE = 'value';
const OVERLAY_POSITION_SOUTH: ConnectedPosition = {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'};

@Component({
  selector: 'app-router-outlet-context',
  templateUrl: './router-outlet-context.component.html',
  styleUrls: ['./router-outlet-context.component.scss'],
})
export class RouterOutletContextComponent implements OnDestroy {

  public readonly NAME = NAME;
  public readonly VALUE = VALUE;

  public form: UntypedFormGroup;

  private _destroy$ = new Subject<void>();

  constructor(host: ElementRef<HTMLElement>,
              formBuilder: UntypedFormBuilder,
              public routerOutlet: SciRouterOutletElement,
              private _overlay: OverlayRef) {
    this.form = new UntypedFormGroup({
      [NAME]: formBuilder.control('', Validators.required),
      [VALUE]: formBuilder.control(''),
    }, {updateOn: 'change'});

    this._overlay.backdropClick()
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this._overlay.dispose();
      });
  }

  @HostListener('keydown.escape')
  public onClose(): void {
    this._overlay.dispose();
  }

  public onAddClick(): void {
    this.routerOutlet.setContextValue(this.form.get(NAME).value, this.parseContextValueFromUI());
    this.form.reset();
  }

  private parseContextValueFromUI(): string | null | undefined {
    const value = this.form.get(VALUE).value;
    switch (value) {
      case '<undefined>':
        return undefined;
      case '<null>':
        return null;
      default:
        return value;
    }
  }

  public onRemoveClick(name: string): void {
    this.routerOutlet.removeContextValue(name);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  public static openAsOverlay(config: {anchor: HTMLElement; routerOutlet: SciRouterOutletElement; overlay: Overlay; injector: Injector}): void {
    const {anchor, routerOutlet, overlay, injector} = config;

    const positionStrategy = overlay.position()
      .flexibleConnectedTo(anchor)
      .withFlexibleDimensions(false)
      .withPositions([OVERLAY_POSITION_SOUTH]);

    const overlayConfig = new OverlayConfig({
      panelClass: 'e2e-router-outlet-context-overlay',
      hasBackdrop: true,
      positionStrategy: positionStrategy,
      scrollStrategy: overlay.scrollStrategies.noop(),
      disposeOnNavigation: true,
      width: 500,
      height: 400,
      backdropClass: 'transparent-backdrop',
    });

    const overlayRef = overlay.create(overlayConfig);
    const portal = new ComponentPortal(RouterOutletContextComponent, null, Injector.create({
      parent: injector,
      providers: [
        {provide: OverlayRef, useValue: overlayRef},
        {provide: SciRouterOutletElement, useValue: routerOutlet},
      ],
    }));
    overlayRef.attach(portal);
  }
}
