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
import {Application, Intention} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';

@Component({
  selector: 'devtools-intention-accordion-item',
  templateUrl: './intention-accordion-item.component.html',
  styleUrls: ['./intention-accordion-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SciQualifierChipListComponent,
  ],
})
export class IntentionAccordionItemComponent {

  public readonly intention = input.required<Intention>();

  protected readonly providers = this.computerProviders();

  private computerProviders(): Signal<Application[]> {
    const manifestService = inject(DevToolsManifestService);
    const providers$ = toObservable(this.intention)
      .pipe(switchMap(intention => manifestService.capabilityProviders$(intention)));
    return toSignal(providers$, {initialValue: []});
  }
}
