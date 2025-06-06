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
import {Application} from '@scion/microfrontend-platform';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Router} from '@angular/router';
import {AsyncPipe} from '@angular/common';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-app-list-item',
  templateUrl: './app-list-item.component.html',
  styleUrls: ['./app-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    SciMaterialIconDirective,
  ],
})
export class AppListItemComponent implements OnInit {

  public readonly application = input.required<Application>();

  private readonly _manifestService = inject(DevToolsManifestService);
  private readonly _router = inject(Router);

  protected capabilityCount$!: Observable<number>;
  protected intentionCount$!: Observable<number>;

  public ngOnInit(): void {
    this.capabilityCount$ = this._manifestService.capabilities$({appSymbolicName: this.application().symbolicName})
      .pipe(map(capabilities => capabilities.length));
    this.intentionCount$ = this._manifestService.intentions$({appSymbolicName: this.application().symbolicName})
      .pipe(map(intentions => intentions.length));
  }

  protected onIntentionsClick(event: MouseEvent): boolean {
    event.preventDefault(); // Prevent href navigation imposed by accessibility rules
    this._router.navigate(['apps', {outlets: {details: [this.application().symbolicName, {activeTab: 'intentions'}]}}]).then();
    return true;
  }

  protected onCapabilitiesClick(event: MouseEvent): boolean {
    event.preventDefault(); // Prevent href navigation imposed by accessibility rules
    this._router.navigate(['apps', {outlets: {details: [this.application().symbolicName, {activeTab: 'capabilities'}]}}]).then();
    return true;
  }
}
