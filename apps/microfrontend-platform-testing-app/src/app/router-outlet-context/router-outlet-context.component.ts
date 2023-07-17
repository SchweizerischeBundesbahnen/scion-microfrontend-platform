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
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {SciRouterOutletElement} from '@scion/microfrontend-platform';
import {ConnectedPosition, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {AsyncPipe, KeyValuePipe, NgFor} from '@angular/common';
import {A11yModule} from '@angular/cdk/a11y';
import {SciListModule} from '@scion/components.internal/list';
import {ContextEntryComponent} from '../context-entry/context-entry.component';

const OVERLAY_POSITION_SOUTH: ConnectedPosition = {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'};

@Component({
  selector: 'app-router-outlet-context',
  templateUrl: './router-outlet-context.component.html',
  styleUrls: ['./router-outlet-context.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    KeyValuePipe,
    A11yModule,
    ReactiveFormsModule,
    SciListModule,
    ContextEntryComponent,
  ],
})
export class RouterOutletContextComponent implements OnDestroy {

  public form = this._formBuilder.group({
    name: this._formBuilder.control('', Validators.required),
    value: this._formBuilder.control(''),
  });

  private _destroy$ = new Subject<void>();

  constructor(host: ElementRef<HTMLElement>,
              private _formBuilder: NonNullableFormBuilder,
              private _overlay: OverlayRef,
              public routerOutlet: SciRouterOutletElement) {
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
    this.routerOutlet.setContextValue(this.form.controls.name.value, this.parseContextValueFromUI());
    this.form.reset();
  }

  private parseContextValueFromUI(): string | null | undefined {
    const value = this.form.controls.value.value;
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
