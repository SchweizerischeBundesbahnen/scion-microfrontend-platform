/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked} from '@angular/core';
import {Application} from '@scion/microfrontend-platform';
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
export class AppListItemComponent {

  public readonly application = input.required<Application>();

  private readonly _manifestService = inject(DevToolsManifestService);
  private readonly _router = inject(Router);

  protected readonly capabilityCount = signal(0);
  protected readonly intentionCount = signal(0);

  constructor() {
    this.computeCapabilityCount();
    this.computeIntentionCount();
  }

  protected onIntentionsClick(event: MouseEvent): boolean {
    event.preventDefault(); // Prevent href navigation imposed by accessibility rules
    void this._router.navigate(['apps', {outlets: {details: [this.application().symbolicName, {activeTab: 'intentions'}]}}]);
    return true;
  }

  protected onCapabilitiesClick(event: MouseEvent): boolean {
    event.preventDefault(); // Prevent href navigation imposed by accessibility rules
    void this._router.navigate(['apps', {outlets: {details: [this.application().symbolicName, {activeTab: 'capabilities'}]}}]);
    return true;
  }

  private computeCapabilityCount(): void {
    effect(onCleanup => {
      const application = this.application();

      untracked(() => {
        const subscription = this._manifestService.capabilities$({appSymbolicName: application.symbolicName})
          .pipe(map(capabilities => capabilities.length))
          .subscribe(capabilityCount => this.capabilityCount.set(capabilityCount));

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private computeIntentionCount(): void {
    effect(onCleanup => {
      const application = this.application();

      untracked(() => {
        const subscription = this._manifestService.intentions$({appSymbolicName: application.symbolicName})
          .pipe(map(intentions => intentions.length))
          .subscribe(intentionCount => this.intentionCount.set(intentionCount));

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
