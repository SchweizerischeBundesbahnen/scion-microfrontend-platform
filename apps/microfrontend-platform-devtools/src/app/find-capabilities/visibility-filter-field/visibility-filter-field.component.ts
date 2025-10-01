/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, effect, inject, signal, untracked} from '@angular/core';
import {CapabilityFilterSession} from '../capability-filter-session.service';

@Component({
  selector: 'devtools-visibility-filter-field',
  templateUrl: './visibility-filter-field.component.html',
  styleUrls: ['./visibility-filter-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityFilterFieldComponent {

  protected readonly private = signal<boolean | undefined>(undefined);
  protected readonly inactive = signal<boolean | undefined>(undefined);

  constructor() {
    const filterSession = inject(CapabilityFilterSession);

    effect(() => {
      const privateFilter = this.private();
      untracked(() => filterSession.setCapabilityPrivateFilter(privateFilter));
    });
    effect(() => {
      const inactiveFilter = this.inactive();
      untracked(() => filterSession.setCapabilityInactiveFilter(inactiveFilter));
    });
  }

  protected onPrivateToggle(state: boolean): void {
    this.private.update(value => value === state ? undefined : state);
  }

  protected onInactiveToggle(state: boolean): void {
    this.inactive.update(value => value === state ? undefined : state);
  }
}
