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
import {Intention} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {map} from 'rxjs/operators';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';

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

  private readonly _manifestService = inject(DevToolsManifestService);

  protected nullProvider = signal(false);

  constructor() {
    this.computeNullProvider();
  }

  private computeNullProvider(): void {
    effect(onCleanup => {
      const intention = this.intention();

      untracked(() => {
        const subscription = this._manifestService.capabilityProviders$(intention)
          .pipe(map(apps => apps.length === 0))
          .subscribe(nullProvider => this.nullProvider.set(nullProvider));
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
