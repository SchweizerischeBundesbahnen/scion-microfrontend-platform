/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, HostListener, Injector} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {SciRouterOutletElement} from '@scion/microfrontend-platform';
import {ConnectedPosition, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {AsyncPipe, KeyValuePipe} from '@angular/common';
import {A11yModule} from '@angular/cdk/a11y';
import {ContextEntryComponent} from '../context-entry/context-entry.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {parseTypedValue} from '../common/typed-value-parser.util';

const OVERLAY_POSITION_SOUTH: ConnectedPosition = {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'};

@Component({
  selector: 'app-router-outlet-context',
  templateUrl: './router-outlet-context.component.html',
  styleUrls: ['./router-outlet-context.component.scss'],
  imports: [
    AsyncPipe,
    KeyValuePipe,
    A11yModule,
    ReactiveFormsModule,
    SciListComponent,
    SciListItemDirective,
    ContextEntryComponent,
    SciMaterialIconDirective,
  ],
})
export class RouterOutletContextComponent {

  public form = this._formBuilder.group({
    name: this._formBuilder.control('', Validators.required),
    value: this._formBuilder.control(''),
  });

  constructor(private _formBuilder: NonNullableFormBuilder,
              private _overlay: OverlayRef,
              public routerOutlet: SciRouterOutletElement) {
    this._overlay.backdropClick()
      .pipe(takeUntilDestroyed())
      .subscribe(() => this._overlay.dispose());
  }

  @HostListener('keydown.escape')
  public onClose(): void {
    this._overlay.dispose();
  }

  public onAddClick(): void {
    this.routerOutlet.setContextValue(this.form.controls.name.value, parseTypedValue(this.form.controls.value.value));
    this.form.reset();
  }

  public onRemoveClick(name: string): void {
    this.routerOutlet.removeContextValue(name);
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
