/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Observable} from 'rxjs';
import {Intention} from '@scion/microfrontend-platform';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {map} from 'rxjs/operators';
import {AsyncPipe, NgIf} from '@angular/common';
import {QualifierChipListComponent} from '../qualifier-chip-list/qualifier-chip-list.component';

@Component({
  selector: 'devtools-intention-accordion-item',
  templateUrl: './intention-accordion-item.component.html',
  styleUrls: ['./intention-accordion-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    QualifierChipListComponent,
  ],
})
export class IntentionAccordionItemComponent implements OnChanges {

  public nullProvider$!: Observable<boolean>;

  @Input()
  public intention!: Intention;

  constructor(private _manifestService: DevToolsManifestService) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.nullProvider$ = this._manifestService.capabilityProviders$(this.intention)
      .pipe(map(apps => apps.length === 0));
  }
}
