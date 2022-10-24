/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, ElementRef, Injector, Input, ViewChild} from '@angular/core';
import {OutletRouter, SciRouterOutletElement} from '@scion/microfrontend-platform';
import {UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {Overlay} from '@angular/cdk/overlay';
import {RouterOutletContextComponent} from '../router-outlet-context/router-outlet-context.component';
import {RouterOutletSettingsComponent} from '../router-outlet-settings/router-outlet-settings.component';
import {ActivatedRoute} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';

export const URL = 'url';

/**
 * Allows entering a URL and displaying the web content in an iframe.
 */
@Component({
  selector: 'app-browser-outlet',
  templateUrl: './browser-outlet.component.html',
  styleUrls: ['./browser-outlet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserOutletComponent {

  public URL = URL;
  public form: UntypedFormGroup;
  public appEntryPoints: AppEndpoint[];

  @Input()
  public outletName: string;

  @ViewChild('settings_button', {static: true})
  public settingsButton: ElementRef<HTMLButtonElement>;

  @ViewChild('context_define_button', {static: true})
  public contextDefineButton: ElementRef<HTMLButtonElement>;

  @ViewChild('router_outlet', {static: true})
  public routerOutlet: ElementRef<SciRouterOutletElement>;

  constructor(host: ElementRef<HTMLElement>,
              formBuilder: UntypedFormBuilder,
              private _activatedRoute: ActivatedRoute,
              private _overlay: Overlay,
              private _injector: Injector) {
    this.form = formBuilder.group({
      [URL]: new UntypedFormControl('', Validators.required),
    });
    this.appEntryPoints = this.readAppEntryPoints();
  }

  public onUrlClearClick(): void {
    this.form.reset();
    this.navigate();
  }

  public onNavigateClick(): boolean {
    this.navigate();
    return false;
  }

  private navigate(): void {
    Beans.get(OutletRouter).navigate(this.form.get(URL).value, {outlet: this.outletName}).then();
  }

  public onSettingsClick(): void {
    RouterOutletSettingsComponent.openAsOverlay({
      anchor: this.settingsButton.nativeElement,
      overlay: this._overlay,
      routerOutlet: this.routerOutlet.nativeElement,
      injector: this._injector,
    });
  }

  public onContextDefineClick(): void {
    RouterOutletContextComponent.openAsOverlay({
      anchor: this.contextDefineButton.nativeElement,
      overlay: this._overlay,
      routerOutlet: this.routerOutlet.nativeElement,
      injector: this._injector,
    });
  }

  public onActivate(event: Event): void {
    console.debug(`[BrowserOutletComponent::sci-router-outlet:onactivate] [outlet=${this.outletName}, url=${(event as CustomEvent).detail}]`);
  }

  public onDeactivate(event: Event): void {
    console.debug(`[BrowserOutletComponent::sci-router-outlet:ondeactivate] [outlet=${this.outletName}, url=${(event as CustomEvent).detail}]`);
  }

  public onFocusWithin(event: Event): void {
    console.debug(`[BrowserOutletComponent::sci-router-outlet:onfocuswithin] [outlet=${this.outletName}, focuswithin=${(event as CustomEvent).detail}]`);
  }

  private readAppEntryPoints(): AppEndpoint[] {
    return Object.values(environment.apps).reduce((endpoints, app) => {
      return endpoints.concat(this._activatedRoute.parent.routeConfig.children
        .filter(route => !!route.data)
        .map(route => {
          const matrixParams: Map<string, any> = route.data['matrixParams'] || new Map();
          const matrixParamsEncoded = Array.from(matrixParams.keys())
            .reduce((encoded, paramKey) => encoded.concat(`;${paramKey}=${matrixParams.get(paramKey)}`), [])
            .join();
          return {
            url: `${app.url}/#/${route.path}${matrixParamsEncoded}`,
            label: `${app.symbolicName}: ${route.data['pageTitle']}`,
          };
        }));
    }, new Array<AppEndpoint>());
  }
}

export interface AppEndpoint {
  url: string;
  label: string;
}
