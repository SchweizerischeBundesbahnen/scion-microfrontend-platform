/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, Injector, ViewChild} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {RouterOutletContextComponent} from '../router-outlet-context/router-outlet-context.component';
import {Overlay} from '@angular/cdk/overlay';
import {SciRouterOutletElement} from '@scion/microfrontend-platform';
import {RouterOutletSettingsComponent} from '../router-outlet-settings/router-outlet-settings.component';
import {NEVER, Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {SciThrobberComponent} from '@scion/components/throbber';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'app-router-outlet',
  templateUrl: './router-outlet.component.html',
  styleUrls: ['./router-outlet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // required because <sci-router-outlet> is a custom element
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    SciThrobberComponent,
    SciMaterialIconDirective,
  ],
})
export default class RouterOutletComponent {

  public form = this._formBuilder.group({
    outletName: this._formBuilder.control(''),
  });
  public outletName: string | undefined;

  @ViewChild('settings_button', {static: true})
  public _settingsButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('context_define_button', {static: true})
  public _contextDefineButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('router_outlet', {static: true})
  public _routerOutlet!: ElementRef<SciRouterOutletElement>;

  constructor(private _formBuilder: NonNullableFormBuilder,
              private _overlay: Overlay,
              private _injector: Injector) {
  }

  public onApplyClick(): boolean {
    this.outletName = this.form.controls.outletName.value || undefined;
    return false;
  }

  public onSettingsClick(): void {
    RouterOutletSettingsComponent.openAsOverlay({
      anchor: this._settingsButton.nativeElement,
      overlay: this._overlay,
      routerOutlet: this._routerOutlet.nativeElement,
      injector: this._injector,
    });
  }

  public onContextDefineClick(): void {
    RouterOutletContextComponent.openAsOverlay({
      anchor: this._contextDefineButton.nativeElement,
      overlay: this._overlay,
      routerOutlet: this._routerOutlet.nativeElement,
      injector: this._injector,
    });
  }

  public onActivate(event: Event): void {
    console.debug(`[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=${this.outletName}, url=${(event as CustomEvent).detail}]`);
  }

  public onDeactivate(event: Event): void {
    console.debug(`[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=${this.outletName}, url=${(event as CustomEvent).detail}]`);
  }

  public onFocusWithin(event: Event): void {
    console.debug(`[RouterOutletComponent::sci-router-outlet:onfocuswithin] [outlet=${this.outletName}, focuswithin=${(event as CustomEvent).detail}]`);
  }

  public get empty$(): Observable<boolean> {
    return this._routerOutlet ? this._routerOutlet.nativeElement.empty$ : NEVER;
  }
}
