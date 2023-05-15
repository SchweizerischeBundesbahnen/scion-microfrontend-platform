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
import {Capability, ParamDefinition} from '@scion/microfrontend-platform';
import {Router} from '@angular/router';
import {Observable, ReplaySubject} from 'rxjs';
import {expand, map, switchMap, take} from 'rxjs/operators';
import {filterManifestObjects} from '../manifest-object-filter.utils';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {UntypedFormControl} from '@angular/forms';
import {Maps} from '@scion/toolkit/util';
import {KeyValue} from '@angular/common';

@Component({
  selector: 'devtools-required-capabilities',
  templateUrl: './required-capabilities.component.html',
  styleUrls: ['./required-capabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequiredCapabilitiesComponent implements OnChanges {

  private _appChange$ = new ReplaySubject<void>(1);

  @Input()
  public appSymbolicName: string;

  public capabilitiesByApp$: Observable<Map<string, Capability[]>>;
  public filterFormControl = new UntypedFormControl();
  public selectedCapability: Capability;

  constructor(manifestService: DevToolsManifestService, private _router: Router) {
    this.capabilitiesByApp$ = this._appChange$
      .pipe(
        switchMap(() => manifestService.observeDependingCapabilities$(this.appSymbolicName)),
        expand(capabilities => this.filterFormControl.valueChanges.pipe(take(1), map(() => capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.filterFormControl.value)),
        map(capabilities => capabilities.reduce((acc, capability) => Maps.addListValue(acc, capability.metadata.appSymbolicName, capability), new Map())),
      );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.filterFormControl.reset('');
    this.selectedCapability = null;
    this._appChange$.next();
  }

  public onCapabilityClick(capability: Capability): void {
    if (this.selectedCapability === capability) {
      this.selectedCapability = null;
    }
    else {
      this.selectedCapability = capability;
    }
  }

  public onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  public onAccordionItemClick(): void {
    this.selectedCapability = null;
  }

  public trackByApplicationFn(index: number, entry: KeyValue<string, Capability[]>): string {
    return entry.key;
  }

  public trackByCapabilityFn(index: number, capability: Capability): string {
    return capability.metadata.id;
  }

  public paramNameFn = (param: ParamDefinition): string => param.name;
}
