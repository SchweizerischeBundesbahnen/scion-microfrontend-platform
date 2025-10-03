/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, Injector, input, untracked, viewChild} from '@angular/core';
import {MessageClient, OutletRouter, SciRouterOutletElement} from '@scion/microfrontend-platform';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Overlay} from '@angular/cdk/overlay';
import {RouterOutletContextComponent} from '../router-outlet-context/router-outlet-context.component';
import {RouterOutletSettingsComponent} from '../router-outlet-settings/router-outlet-settings.component';
import {ActivatedRoute} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';
import {TestingAppTopics} from '../testing-app.topics';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

/**
 * Allows entering a URL and displaying the web content in an iframe.
 */
@Component({
  selector: 'app-browser-outlet',
  templateUrl: './browser-outlet.component.html',
  styleUrls: ['./browser-outlet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SciMaterialIconDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // required because <sci-router-outlet> is a custom element
})
export class BrowserOutletComponent {

  public readonly outletName = input.required<string>();

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _overlay = inject(Overlay);
  private readonly _injector = inject(Injector);
  private readonly _settingsButton = viewChild.required<ElementRef<HTMLButtonElement>>('settings_button');
  private readonly _contextDefineButton = viewChild.required<ElementRef<HTMLButtonElement>>('context_define_button');
  private readonly _routerOutlet = viewChild.required<ElementRef<SciRouterOutletElement>>('router_outlet');

  protected readonly appEntryPoints: AppEndpoint[];
  protected readonly form = this._formBuilder.group({
    url: this._formBuilder.control(null, Validators.required),
  });

  constructor() {
    this.appEntryPoints = this.readAppEntryPoints();
    this.installOutletContextUpdateHandler();
  }

  protected onUrlClearClick(): void {
    this.form.reset();
    this.navigate();
  }

  protected onNavigateClick(): boolean {
    this.navigate();
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
    console.debug(`[BrowserOutletComponent::sci-router-outlet:onactivate] [outlet=${this.outletName()}, url=${(event as CustomEvent).detail}]`);
  }

  protected onDeactivate(event: Event): void {
    console.debug(`[BrowserOutletComponent::sci-router-outlet:ondeactivate] [outlet=${this.outletName()}, url=${(event as CustomEvent).detail}]`);
  }

  protected onFocusWithin(event: Event): void {
    console.debug(`[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=${this.outletName()}, focuswithin=${(event as CustomEvent).detail}]`);
  }

  private navigate(): void {
    void Beans.get(OutletRouter).navigate(this.form.controls.url.value, {outlet: this.outletName()});
  }

  private readAppEntryPoints(): AppEndpoint[] {
    return Object.values(environment.apps).reduce((endpoints, app) => {
      return endpoints.concat(this._activatedRoute.parent!.routeConfig!.children!
        .filter(route => !!route.data)
        .map(route => {
          const matrixParams = (route.data!['matrixParams'] ?? new Map()) as Map<string, unknown>;
          const matrixParamsEncoded = Array.from(matrixParams.keys())
            .reduce((encoded, paramKey) => encoded.concat(`;${paramKey}=${matrixParams.get(paramKey)}`), new Array<string>())
            .join();
          return {
            url: `${app.url}/#/${route.path}${matrixParamsEncoded}`,
            label: `${app.symbolicName}: ${route.data!['pageTitle']}`,
          };
        }));
    }, new Array<AppEndpoint>());
  }

  /**
   * Listens for messages to update the context of this outlet.
   */
  private installOutletContextUpdateHandler(): void {
    effect(onCleanup => {
      const outletName = this.outletName();
      const routerOutlet = this._routerOutlet();

      untracked(() => {
        const subscription = Beans.get(MessageClient).observe$(TestingAppTopics.routerOutletContextUpdateTopic(outletName, ':key'))
          .subscribe(message => routerOutlet.nativeElement.setContextValue(message.params!.get('key')!, message.body));

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}

export interface AppEndpoint {
  url: string;
  label: string;
}
