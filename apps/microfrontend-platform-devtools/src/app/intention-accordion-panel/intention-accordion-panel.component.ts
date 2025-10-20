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
import {Application, Intention} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Router} from '@angular/router';

@Component({
  selector: 'devtools-intention-accordion-panel',
  templateUrl: './intention-accordion-panel.component.html',
  styleUrls: ['./intention-accordion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntentionAccordionPanelComponent {

  public readonly intention = input.required<Intention>();

  private readonly _router = inject(Router);

  protected readonly applications = signal(new Array<Application>());

  constructor() {
    this.computeApplications();
  }

  protected onProviderClick(application: Application): boolean {
    void this._router.navigate(['apps', {outlets: {details: [application.symbolicName, {activeTab: 'capabilities'}]}}]);
    return false;
  }

  private computeApplications(): void {
    const manifestService = inject(DevToolsManifestService);
    effect(onCleanup => {
      const intention = this.intention();

      untracked(() => {
        const subscription = manifestService.capabilityProviders$(intention).subscribe(applications => this.applications.set(applications));
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
