/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, ElementRef, Injector, Input, OnInit, ViewChild} from '@angular/core';
import {MessageClient, OutletRouter, SciRouterOutletElement} from '@scion/microfrontend-platform';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Overlay} from '@angular/cdk/overlay';
import {RouterOutletContextComponent} from '../router-outlet-context/router-outlet-context.component';
import {RouterOutletSettingsComponent} from '../router-outlet-settings/router-outlet-settings.component';
import {ActivatedRoute} from '@angular/router';
import {Beans} from '@scion/toolkit/bean-manager';
import {environment} from '../../environments/environment';
import {TestingAppTopics} from '../testing-app.topics';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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
export class BrowserOutletComponent implements OnInit {

  public form = this._formBuilder.group({
    url: this._formBuilder.control(null, Validators.required),
  });
  public appEntryPoints: AppEndpoint[];

  @Input({required: true})
  public outletName!: string;

  @ViewChild('settings_button', {static: true})
  public settingsButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('context_define_button', {static: true})
  public contextDefineButton!: ElementRef<HTMLButtonElement>;

  @ViewChild('router_outlet', {static: true})
  public routerOutlet!: ElementRef<SciRouterOutletElement>;

  constructor(private _formBuilder: NonNullableFormBuilder,
              private _activatedRoute: ActivatedRoute,
              private _overlay: Overlay,
              private _injector: Injector,
              private _destroyRef: DestroyRef) {
    this.appEntryPoints = this.readAppEntryPoints();
  }

  public ngOnInit(): void {
    this.installOutletContextUpdateHandler(this.outletName);
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
    Beans.get(OutletRouter).navigate(this.form.controls.url.value, {outlet: this.outletName}).then();
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
      return endpoints.concat(this._activatedRoute.parent!.routeConfig!.children!
        .filter(route => !!route.data)
        .map(route => {
          const matrixParams: Map<string, any> = route.data!['matrixParams'] || new Map();
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
  private installOutletContextUpdateHandler(outletName: string): void {
    Beans.get(MessageClient).observe$(TestingAppTopics.routerOutletContextUpdateTopic(outletName, ':key'))
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(message => {
        this.routerOutlet.nativeElement.setContextValue(message.params!.get('key')!, message.body);
      });
  }
}

export interface AppEndpoint {
  url: string;
  label: string;
}
