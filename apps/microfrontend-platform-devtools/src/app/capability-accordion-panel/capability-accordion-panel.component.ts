/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Application, Capability } from '@scion/microfrontend-platform';
import { DevToolsManifestService } from '../dev-tools-manifest.service';

@Component({
  selector: 'devtools-capability-accordion-panel',
  templateUrl: './capability-accordion-panel.component.html',
  styleUrls: ['./capability-accordion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilityAccordionPanelComponent implements OnInit {

  public applications$: Observable<Application[]>;

  @Input()
  public capability: Capability;

  constructor(private _manifestService: DevToolsManifestService) {
  }

  public ngOnInit(): void {
    this.applications$ = this._manifestService.capabilityConsumers$(this.capability);
  }
}
