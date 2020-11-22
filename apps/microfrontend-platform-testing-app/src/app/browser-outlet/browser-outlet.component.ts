/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Injector, Input, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Application, ManifestService, OutletRouter, SciRouterOutletElement } from '@scion/microfrontend-platform';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Overlay } from '@angular/cdk/overlay';
import { RouterOutletContextComponent } from '../router-outlet-context/router-outlet-context.component';
import { RouterOutletSettingsComponent } from '../router-outlet-settings/router-outlet-settings.component';
import { ActivatedRoute } from '@angular/router';
import { ConsoleService } from '../console/console.service';
import { Beans } from '@scion/toolkit/bean-manager';

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
  public form: FormGroup;
  public appEntryPoints$: Observable<AppEndpoint[]>;

  @Input()
  @HostBinding('attr.id')
  public outletName: string;

  @ViewChild('settings_button', {static: true})
  public settingsButton: ElementRef<HTMLButtonElement>;

  @ViewChild('context_define_button', {static: true})
  public contextDefineButton: ElementRef<HTMLButtonElement>;

  @ViewChild('router_outlet', {static: true})
  public routerOutlet: ElementRef<SciRouterOutletElement>;

  constructor(host: ElementRef<HTMLElement>,
              formBuilder: FormBuilder,
              private _activatedRoute: ActivatedRoute,
              private _overlay: Overlay,
              private _injector: Injector,
              private _consoleService: ConsoleService) {
    this.form = formBuilder.group({
      [URL]: new FormControl('', Validators.required),
    });
    this.appEntryPoints$ = this.readAppEntryPoints();
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
    this._consoleService.log('sci-router-outlet:onactivate', (event as CustomEvent).detail);
  }

  public onDeactivate(event: Event): void {
    this._consoleService.log('sci-router-outlet:ondeactivate', (event as CustomEvent).detail);
  }

  private readAppEntryPoints(): Observable<AppEndpoint[]> {
    return Beans.get(ManifestService).lookupApplications$()
      .pipe(map((applications: Application[]) => {
          const endpoints: AppEndpoint[] = [];
          applications.forEach(application => {
            const origin = application.origin;
            const symbolicName = application.symbolicName;

            this._activatedRoute.parent.routeConfig.children
              .filter(route => !!route.data)
              .forEach(route => {
                const matrixParams: Map<string, any> = route.data['matrixParams'] || new Map();
                const matrixParamsEncoded = Array.from(matrixParams.keys())
                  .reduce((encoded, paramKey) => encoded.concat(`${paramKey}=${matrixParams.get(paramKey)}`), [])
                  .join(';');
                endpoints.push({url: `${origin}/#/${route.path}${matrixParamsEncoded ? `;${matrixParamsEncoded}` : ''}`, label: `${symbolicName}: ${route.data['pageTitle']}`});
              });
          });
          return endpoints;
        }),
      );
  }
}

export interface AppEndpoint {
  url: string;
  label: string;
}
