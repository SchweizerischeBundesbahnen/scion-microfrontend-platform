/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Capability, ParamDefinition} from '@scion/microfrontend-platform';
import {Router} from '@angular/router';
import {Observable, ReplaySubject} from 'rxjs';
import {expand, map, switchMap, take} from 'rxjs/operators';
import {filterManifestObjects} from '../common/manifest-object-filter.utils';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Maps} from '@scion/toolkit/util';
import {AsyncPipe, KeyValuePipe} from '@angular/common';
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
    AsyncPipe,
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
export class RequiredCapabilitiesComponent implements OnChanges {

  private readonly _router = inject(Router);
  private readonly _formBuilder = inject(NonNullableFormBuilder);

  private _appChange$ = new ReplaySubject<void>(1);

  @Input({required: true})
  public appSymbolicName!: string;

  public capabilitiesByApp$: Observable<Map<string, Capability[]>>;
  public filterFormControl = this._formBuilder.control('');
  public selectedCapability: Capability | undefined;

  constructor(manifestService: DevToolsManifestService) {
    this.capabilitiesByApp$ = this._appChange$
      .pipe(
        switchMap(() => manifestService.observeDependingCapabilities$(this.appSymbolicName)),
        expand(capabilities => this.filterFormControl.valueChanges.pipe(take(1), map(() => capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.filterFormControl.value)),
        map(capabilities => capabilities.reduce((acc, capability) => Maps.addListValue(acc, capability.metadata!.appSymbolicName, capability), new Map<string, Capability[]>())),
      );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.filterFormControl.reset();
    this.selectedCapability = undefined;
    this._appChange$.next();
  }

  public onCapabilityClick(capability: Capability): void {
    if (this.selectedCapability === capability) {
      this.selectedCapability = undefined;
    }
    else {
      this.selectedCapability = capability;
    }
  }

  public onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    void this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  public paramNameFn = (param: ParamDefinition): string => param.name;
}
