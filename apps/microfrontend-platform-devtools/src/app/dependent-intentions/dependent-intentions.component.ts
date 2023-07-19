/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Intention} from '@scion/microfrontend-platform';
import {Router} from '@angular/router';
import {Observable, ReplaySubject} from 'rxjs';
import {expand, map, switchMap, take} from 'rxjs/operators';
import {filterManifestObjects} from '../common/manifest-object-filter.utils';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {Maps} from '@scion/toolkit/util';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {AsyncPipe, KeyValue, KeyValuePipe, NgFor} from '@angular/common';
import {AppNamePipe} from '../common/app-name.pipe';
import {QualifierChipListComponent} from '../qualifier-chip-list/qualifier-chip-list.component';
import {SciAccordionComponent, SciAccordionItemDirective} from '@scion/components.internal/accordion';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';

@Component({
  selector: 'devtools-dependent-intentions',
  templateUrl: './dependent-intentions.component.html',
  styleUrls: ['./dependent-intentions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    KeyValuePipe,
    ReactiveFormsModule,
    SciFilterFieldComponent,
    SciAccordionComponent,
    SciAccordionItemDirective,
    AppNamePipe,
    QualifierChipListComponent,
  ],
})
export class DependentIntentionsComponent implements OnInit, OnChanges {

  private _appChange$ = new ReplaySubject<void>(1);

  @Input({required: true})
  public appSymbolicName!: string;

  public intentionsByApp$: Observable<Map<string, Intention[]>> | undefined;
  public filterFormControl = this._formBuilder.control('');

  constructor(private _router: Router,
              private _formBuilder: NonNullableFormBuilder,
              private _manifestService: DevToolsManifestService) {
  }

  public ngOnInit(): void {
    this.intentionsByApp$ = this._appChange$
      .pipe(
        switchMap(() => this._manifestService.observeDependentIntentions$(this.appSymbolicName)),
        expand(intentions => this.filterFormControl.valueChanges.pipe(take(1), map(() => intentions))),
        map(intentions => filterManifestObjects(intentions, this.filterFormControl.value)),
        map(intentions => intentions.reduce((acc, intention) => Maps.addListValue(acc, intention.metadata!.appSymbolicName, intention), new Map())),
      );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.filterFormControl.reset('');
    this._appChange$.next();
  }

  public onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  public trackByApplicationFn(index: number, entry: KeyValue<string, Intention[]>): string {
    return entry.key;
  }

  public trackByIntentionFn(index: number, intention: Intention): string {
    return intention.metadata!.id;
  }
}
