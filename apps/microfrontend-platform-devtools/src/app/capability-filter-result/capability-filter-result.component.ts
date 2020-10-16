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

@Component({
  selector: 'devtools-capability-filter-result',
  templateUrl: './capability-filter-result.component.html',
  styleUrls: ['./capability-filter-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilityFilterResultComponent {

  public capabilities$: Observable<Capability[]>;

  constructor(shellService: ShellService, capabilityFilterSession: CapabilityFilterSession) {
    shellService.detailsTitle = 'Capabilities matching your filter criteria';
    this.capabilities$ = capabilityFilterSession.capabilities$();
  }
}
