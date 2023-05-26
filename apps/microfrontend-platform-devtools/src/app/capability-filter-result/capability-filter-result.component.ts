/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Observable} from 'rxjs';
import {Capability} from '@scion/microfrontend-platform';
import {CapabilityFilterSession} from '../find-capabilities/capability-filter-session.service';
import {ShellService} from '../shell.service';
import {ReactiveFormsModule, UntypedFormControl} from '@angular/forms';
import {expand, map, take} from 'rxjs/operators';
import {filterManifestObjects} from '../common/manifest-object-filter.utils';
import {AsyncPipe, NgFor, NgIf} from '@angular/common';
import {SciFilterFieldModule} from '@scion/components.internal/filter-field';
import {SciViewportModule} from '@scion/components/viewport';
import {SciAccordionModule} from '@scion/components.internal/accordion';
import {CapabilityAccordionPanelComponent} from '../capability-accordion-panel/capability-accordion-panel.component';
import {CapabilityAccordionItemComponent} from '../capability-accordion-item/capability-accordion-item.component';

@Component({
  selector: 'devtools-capability-filter-result',
  templateUrl: './capability-filter-result.component.html',
  styleUrls: ['./capability-filter-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    ReactiveFormsModule,
    SciFilterFieldModule,
    SciViewportModule,
    SciAccordionModule,
    CapabilityAccordionPanelComponent,
    CapabilityAccordionItemComponent,
  ],
})
export default class CapabilityFilterResultComponent {

  public capabilities$: Observable<Capability[]>;
  public filterFormControl = new UntypedFormControl();

  constructor(shellService: ShellService, capabilityFilterSession: CapabilityFilterSession) {
    shellService.detailsTitle = 'Capabilities';
    this.capabilities$ = capabilityFilterSession.capabilities$()
      .pipe(
        expand(capabilities => this.filterFormControl.valueChanges.pipe(take(1), map(() => capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.filterFormControl.value)),
      );
  }
}
