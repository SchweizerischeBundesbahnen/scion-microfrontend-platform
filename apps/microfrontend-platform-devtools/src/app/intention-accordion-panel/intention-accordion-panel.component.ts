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
import {Application, Intention} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Router} from '@angular/router';
import {AsyncPipe, NgFor} from '@angular/common';

@Component({
  selector: 'devtools-intention-accordion-panel',
  templateUrl: './intention-accordion-panel.component.html',
  styleUrls: ['./intention-accordion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
  ],
})
export class IntentionAccordionPanelComponent implements OnInit {

  public applications$: Observable<Application[]>;

  @Input()
  public intention: Intention;

  constructor(private _manifestService: DevToolsManifestService, private _router: Router) {
  }

  public ngOnInit(): void {
    this.applications$ = this._manifestService.capabilityProviders$(this.intention);
  }

  public onProviderClick(application: Application): boolean {
    this._router.navigate(['apps', {outlets: {details: [application.symbolicName, {activeTab: 'capabilities'}]}}]).then();
    return false;
  }
}
