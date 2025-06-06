/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, inject, input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Application, Capability} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Router, RouterLink} from '@angular/router';
import {AsyncPipe, JsonPipe} from '@angular/common';
import {SciKeyValueComponent} from '@scion/components.internal/key-value';
import {CustomParamMetadataPipe} from '../common/custom-param-metadata.pipe';
import {AppNamePipe} from '../common/app-name.pipe';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'devtools-capability-accordion-panel',
  templateUrl: './capability-accordion-panel.component.html',
  styleUrls: ['./capability-accordion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    JsonPipe,
    RouterLink,
    AppNamePipe,
    CustomParamMetadataPipe,
    SciTabbarComponent,
    SciTabDirective,
    SciKeyValueComponent,
  ],
})
export class CapabilityAccordionPanelComponent implements OnInit {

  public readonly capability = input.required<Capability>();

  private readonly _manifestService = inject(DevToolsManifestService);
  private readonly _router = inject(Router);

  protected applications$!: Observable<Application[]>;

  public ngOnInit(): void {
    this.applications$ = this._manifestService.capabilityConsumers$(this.capability());
  }

  protected onConsumerClick(application: Application): boolean {
    this._router.navigate(['apps', {outlets: {details: [application.symbolicName, {activeTab: 'intentions'}]}}]).then();
    return false;
  }
}
