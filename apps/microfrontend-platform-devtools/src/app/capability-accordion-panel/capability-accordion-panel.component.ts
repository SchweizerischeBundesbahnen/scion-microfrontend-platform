/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Application, Capability} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Router, RouterLink} from '@angular/router';
import {AsyncPipe, JsonPipe, NgFor, NgIf} from '@angular/common';
import {SciTabbarModule} from '@scion/components.internal/tabbar';
import {SciPropertyModule} from '@scion/components.internal/property';
import {CustomParamMetadataPipe} from '../common/custom-param-metadata.pipe';
import {AppNamePipe} from '../common/app-name.pipe';

@Component({
  selector: 'devtools-capability-accordion-panel',
  templateUrl: './capability-accordion-panel.component.html',
  styleUrls: ['./capability-accordion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    JsonPipe,
    RouterLink,
    AppNamePipe,
    CustomParamMetadataPipe,
    SciTabbarModule,
    SciPropertyModule,
  ],
})
export class CapabilityAccordionPanelComponent implements OnInit {

  public applications$!: Observable<Application[]>;

  @Input()
  public capability!: Capability;

  constructor(private _manifestService: DevToolsManifestService, private _router: Router) {
  }

  public ngOnInit(): void {
    this.applications$ = this._manifestService.capabilityConsumers$(this.capability);
  }

  public onConsumerClick(application: Application): boolean {
    this._router.navigate(['apps', {outlets: {details: [application.symbolicName, {activeTab: 'intentions'}]}}]).then();
    return false;
  }
}
