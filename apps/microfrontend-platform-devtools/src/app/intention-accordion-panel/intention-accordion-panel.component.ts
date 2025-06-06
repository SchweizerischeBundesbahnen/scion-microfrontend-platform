/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, inject, input, Signal} from '@angular/core';
import {switchMap} from 'rxjs';
import {Application, Intention} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Router} from '@angular/router';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'devtools-intention-accordion-panel',
  templateUrl: './intention-accordion-panel.component.html',
  styleUrls: ['./intention-accordion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntentionAccordionPanelComponent {

  public readonly intention = input.required<Intention>();

  protected readonly providers = this.computerProviders();

  private readonly _router = inject(Router);

  private computerProviders(): Signal<Application[]> {
    const manifestService = inject(DevToolsManifestService);
    const providers$ = toObservable(this.intention)
      .pipe(switchMap(intention => manifestService.capabilityProviders$(intention)));
    return toSignal(providers$, {initialValue: []});
  }

  protected onProviderClick(application: Application): boolean {
    this._router.navigate(['apps', {outlets: {details: [application.symbolicName, {activeTab: 'capabilities'}]}}]).then();
    return false;
  }
}
