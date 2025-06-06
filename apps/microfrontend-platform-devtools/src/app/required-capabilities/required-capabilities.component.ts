/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, effect, inject, input, Signal, signal, untracked} from '@angular/core';
import {Capability, ParamDefinition} from '@scion/microfrontend-platform';
import {Router} from '@angular/router';
import {expand, map, take} from 'rxjs/operators';
import {filterManifestObjects} from '../common/manifest-object-filter.utils';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Maps} from '@scion/toolkit/util';
import {KeyValuePipe} from '@angular/common';
import {AppNamePipe} from '../common/app-name.pipe';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {ParamsFilterPipe} from '../common/params-filter.pipe';
import {NullIfEmptyPipe} from '../common/null-if-empty.pipe';
import {JoinPipe} from '../common/join.pipe';
import {SciAccordionComponent, SciAccordionItemDirective} from '@scion/components.internal/accordion';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {SciKeyValueComponent} from '@scion/components.internal/key-value';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-required-capabilities',
  templateUrl: './required-capabilities.component.html',
  styleUrls: ['./required-capabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KeyValuePipe,
    ReactiveFormsModule,
    SciFilterFieldComponent,
    SciAccordionComponent,
    SciAccordionItemDirective,
    SciKeyValueComponent,
    SciMaterialIconDirective,
    SciQualifierChipListComponent,
    AppNamePipe,
    ParamsFilterPipe,
    NullIfEmptyPipe,
    JoinPipe,
  ],
})
export class RequiredCapabilitiesComponent {

  public readonly appSymbolicName = input.required<string>();

  private readonly _router = inject(Router);
  private readonly _formBuilder = inject(NonNullableFormBuilder);

  protected readonly capabilitiesByApp = this.computeDependingCapabilities();
  protected readonly selectedCapability = signal<Capability | undefined>(undefined);
  protected readonly filterFormControl = this._formBuilder.control('');
  protected readonly paramNameFn = (param: ParamDefinition): string => param.name;

  protected onCapabilityClick(capability: Capability): void {
    this.selectedCapability.update(selectedCapability => selectedCapability === capability ? undefined : capability);
  }

  protected onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  private computeDependingCapabilities(): Signal<Map<string, Capability[]>> {
    const manifestService = inject(DevToolsManifestService);
    const capabilities = signal<Map<string, Capability[]>>(new Map());

    effect(onCleanup => {
      const appSymbolicName = this.appSymbolicName();

      untracked(() => {
        this.filterFormControl.reset();
        this.selectedCapability.set(undefined);

        const subscription = manifestService.observeDependingCapabilities$(appSymbolicName)
          .pipe(
            expand(capabilities => this.filterFormControl.valueChanges.pipe(take(1), map(() => capabilities))),
            map(capabilities => filterManifestObjects(capabilities, this.filterFormControl.value)),
            map(capabilities => capabilities.reduce((acc, capability) => Maps.addListValue(acc, capability.metadata!.appSymbolicName, capability), new Map())),
          )
          .subscribe(capabilitiesByApp => capabilities.set(capabilitiesByApp));
        onCleanup(() => subscription.unsubscribe());
      });
    });
    return capabilities;
  }
}
