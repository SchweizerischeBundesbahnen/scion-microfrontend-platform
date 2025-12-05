/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, Injector, signal, viewChild} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {RouterOutletContextComponent} from '../router-outlet-context/router-outlet-context.component';
import {Overlay} from '@angular/cdk/overlay';
import {SciRouterOutletElement} from '@scion/microfrontend-platform';
import {RouterOutletSettingsComponent} from '../router-outlet-settings/router-outlet-settings.component';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {SciThrobberComponent} from '@scion/components/throbber';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'app-router-outlet',
  templateUrl: './router-outlet.component.html',
  styleUrls: ['./router-outlet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // required because <sci-router-outlet> is a custom element
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    SciThrobberComponent,
    SciMaterialIconDirective,
  ],
})
export default class RouterOutletComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _overlay = inject(Overlay);
  private readonly _injector = inject(Injector);
  private readonly _settingsButton = viewChild.required<ElementRef<HTMLButtonElement>>('settings_button');
  private readonly _contextDefineButton = viewChild.required<ElementRef<HTMLButtonElement>>('context_define_button');
  private readonly _routerOutlet = viewChild.required<ElementRef<SciRouterOutletElement>>('router_outlet');

  protected readonly outletName = signal<string | undefined>(undefined);
  protected readonly form = this._formBuilder.group({
    outletName: this._formBuilder.control(''),
  });

  protected onApplyClick(): boolean {
    this.outletName.set(this.form.controls.outletName.value || undefined);
    return false;
  }

  protected onSettingsClick(): void {
    RouterOutletSettingsComponent.openAsOverlay({
      anchor: this._settingsButton().nativeElement,
      overlay: this._overlay,
      routerOutlet: this._routerOutlet().nativeElement,
      injector: this._injector,
    });
  }

  protected onContextDefineClick(): void {
    RouterOutletContextComponent.openAsOverlay({
      anchor: this._contextDefineButton().nativeElement,
      overlay: this._overlay,
      routerOutlet: this._routerOutlet().nativeElement,
      injector: this._injector,
    });
  }

  protected onActivate(event: Event): void {
    console.debug(`[RouterOutletComponent::sci-router-outlet:onactivate] [outlet=${this.outletName()}, url=${(event as CustomEvent).detail}]`);
  }

  protected onDeactivate(event: Event): void {
    console.debug(`[RouterOutletComponent::sci-router-outlet:ondeactivate] [outlet=${this.outletName()}, url=${(event as CustomEvent).detail}]`);
  }

  protected onFocusWithin(event: Event): void {
    console.debug(`[RouterOutletComponent::sci-router-outlet:onfocuswithin] [outlet=${this.outletName()}, focuswithin=${(event as CustomEvent).detail}]`);
  }

  protected get empty$(): Observable<boolean> {
    return this._routerOutlet().nativeElement.empty$;
  }
}
