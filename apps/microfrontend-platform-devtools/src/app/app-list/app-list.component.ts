/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Application} from '@scion/microfrontend-platform';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {sortArray} from '@scion/toolkit/operators';
import {ShellService} from '../shell.service';
import {AsyncPipe} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {AppListItemComponent} from '../app-list-item/app-list-item.component';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';

@Component({
  selector: 'devtools-app-list',
  templateUrl: './app-list.component.html',
  styleUrls: ['./app-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    SciListComponent,
    SciListItemDirective,
    AppListItemComponent,
  ],
})
export class AppListComponent {

  private readonly _manifestService = inject(DevToolsManifestService);
  private readonly _appFilter$ = new BehaviorSubject<string>('');

  protected readonly applications$: Observable<Application[]>;

  constructor() {
    inject(ShellService).primaryTitle = 'Micro Applications';

    this.applications$ = this._appFilter$
      .pipe(
        map(appFilter => this._manifestService.applications.filter(app => app.name.toLowerCase().includes(appFilter))),
        sortArray(byName),
      );
  }

  public onAppFilter(appFilter: string): void {
    this._appFilter$.next(appFilter.toLowerCase());
  }
}

const byName = (app1: Application, app2: Application): number => app1.name.localeCompare(app2.name);
