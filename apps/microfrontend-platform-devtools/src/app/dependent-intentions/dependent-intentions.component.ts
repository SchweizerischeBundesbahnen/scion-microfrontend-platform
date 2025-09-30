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
import {Router} from '@angular/router';
import {expand, map, take} from 'rxjs/operators';
import {filterManifestObjects} from '../common/manifest-object-filter.utils';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Maps} from '@scion/toolkit/util';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {KeyValuePipe} from '@angular/common';
import {AppNamePipe} from '../common/app-name.pipe';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {SciAccordionComponent, SciAccordionItemDirective} from '@scion/components.internal/accordion';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-dependent-intentions',
  templateUrl: './dependent-intentions.component.html',
  styleUrls: ['./dependent-intentions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KeyValuePipe,
    ReactiveFormsModule,
    SciFilterFieldComponent,
    SciAccordionComponent,
    SciAccordionItemDirective,
    AppNamePipe,
    SciQualifierChipListComponent,
    SciMaterialIconDirective,
  ],
})
export class DependentIntentionsComponent {

  public readonly appSymbolicName = input.required<string>();

  private readonly _router = inject(Router);
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _manifestService = inject(DevToolsManifestService);

  protected readonly intentionsByApp = signal(new Map<string, Intention[]>());
  protected readonly filterFormControl = this._formBuilder.control('');

  constructor() {
    this.computeIntentionsByApp();
  }

  protected onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    void this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  private computeIntentionsByApp(): void {
    effect(onCleanup => {
      const appSymbolicName = this.appSymbolicName();

      untracked(() => {
        this.filterFormControl.reset('');

        const subscription = this._manifestService.observeDependentIntentions$(appSymbolicName)
          .pipe(
            expand(intentions => this.filterFormControl.valueChanges.pipe(take(1), map(() => intentions))),
            map(intentions => filterManifestObjects(intentions, this.filterFormControl.value)),
            map(intentions => intentions.reduce((acc, intention) => Maps.addListValue(acc, intention.metadata!.appSymbolicName, intention), new Map<string, Intention[]>())),
          )
          .subscribe(intentionsByApp => this.intentionsByApp.set(intentionsByApp));
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
