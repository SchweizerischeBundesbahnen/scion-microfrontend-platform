/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Capability } from '@scion/microfrontend-platform';
import { CapabilityFilterSession } from '../find-capabilities/capability-filter-session.service';
import { ShellService } from '../shell.service';
import { FormControl } from '@angular/forms';
import { expand, map, mapTo, take } from 'rxjs/operators';
import { filterManifestObjects } from '../manifest-object-filter.utils';

@Component({
  selector: 'devtools-capability-filter-result',
  templateUrl: './capability-filter-result.component.html',
  styleUrls: ['./capability-filter-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilityFilterResultComponent {

  public capabilities$: Observable<Capability[]>;
  public filterFormControl = new FormControl();

  constructor(shellService: ShellService, capabilityFilterSession: CapabilityFilterSession) {
    shellService.detailsTitle = 'Capabilities';
    this.capabilities$ = capabilityFilterSession.capabilities$()
      .pipe(
        expand(capabilities => this.filterFormControl.valueChanges.pipe(take(1), mapTo(capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.filterFormControl.value)),
      );
  }
}
