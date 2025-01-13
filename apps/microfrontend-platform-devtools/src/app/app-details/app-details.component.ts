/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {combineLatestWith, Observable, Subject} from 'rxjs';
import {Application, Capability, Intention} from '@scion/microfrontend-platform';
import {distinctUntilChanged, expand, map, switchMap, take} from 'rxjs/operators';
import {DevToolsManifestService} from '../dev-tools-manifest.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filterManifestObjects} from '../common/manifest-object-filter.utils';
import {ShellService} from '../shell.service';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {AsyncPipe} from '@angular/common';
import {SciViewportComponent} from '@scion/components/viewport';
import {CapabilityAccordionItemComponent} from '../capability-accordion-item/capability-accordion-item.component';
import {CapabilityAccordionPanelComponent} from '../capability-accordion-panel/capability-accordion-panel.component';
import {IntentionAccordionItemComponent} from '../intention-accordion-item/intention-accordion-item.component';
import {IntentionAccordionPanelComponent} from '../intention-accordion-panel/intention-accordion-panel.component';
import {RequiredCapabilitiesComponent} from '../required-capabilities/required-capabilities.component';
import {DependentIntentionsComponent} from '../dependent-intentions/dependent-intentions.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciAccordionComponent, SciAccordionItemDirective} from '@scion/components.internal/accordion';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';

@Component({
  selector: 'devtools-app-details',
  templateUrl: './app-details.component.html',
  styleUrls: ['./app-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    SciTabbarComponent,
    SciTabDirective,
    SciFilterFieldComponent,
    SciViewportComponent,
    SciAccordionComponent,
    SciAccordionItemDirective,
    SciSashboxComponent,
    SciSashDirective,
    CapabilityAccordionItemComponent,
    CapabilityAccordionPanelComponent,
    IntentionAccordionItemComponent,
    IntentionAccordionPanelComponent,
    RequiredCapabilitiesComponent,
    DependentIntentionsComponent,
  ],
})
export class AppDetailsComponent {

  public application$: Observable<Application>;
  public capabilities$: Observable<Capability[]>;
  public intentions$: Observable<Intention[]>;

  public capabilityFilterFormControl = this._formBuilder.control('');
  public intentionFilterFormControl = this._formBuilder.control('');

  private _tabbar$ = new Subject<SciTabbarComponent>();

  constructor(private _shellService: ShellService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _manifestService: DevToolsManifestService,
              private _cd: ChangeDetectorRef,
              private _formBuilder: NonNullableFormBuilder) {
    this.application$ = this.observeApplication$();
    this.capabilities$ = this.observeCapabilities$();
    this.intentions$ = this.observeIntentions$();

    this.installTitleProvider();
    this.installTabActivator();
  }

  private observeApplication$(): Observable<Application> {
    return this._route.paramMap
      .pipe(
        map(paramMap => paramMap.get('appSymbolicName')!),
        distinctUntilChanged(),
        map(appSymbolicName => this._manifestService.getApplication(appSymbolicName)!),
      );
  }

  private observeCapabilities$(): Observable<Capability[]> {
    return this.application$
      .pipe(
        switchMap(application => this._manifestService.capabilities$({appSymbolicName: application.symbolicName})),
        expand(capabilities => this.capabilityFilterFormControl.valueChanges.pipe(take(1), map(() => capabilities))),
        map(capabilities => filterManifestObjects(capabilities, this.capabilityFilterFormControl.value)),
      );
  }

  private observeIntentions$(): Observable<Intention[]> {
    return this.application$
      .pipe(
        switchMap(application => this._manifestService.intentions$({appSymbolicName: application.symbolicName})),
        expand(intentions => this.intentionFilterFormControl.valueChanges.pipe(take(1), map(() => intentions))),
        map(intentions => filterManifestObjects(intentions, this.intentionFilterFormControl.value)),
      );
  }

  private installTitleProvider(): void {
    this.application$
      .pipe(takeUntilDestroyed())
      .subscribe(application => {
        this._shellService.detailsTitle = application.name;
        this._cd.markForCheck();
      });
  }

  private installTabActivator(): void {
    this._route.paramMap
      .pipe(
        map(params => params.get('activeTab')), // read 'activeTab' matrix param from URL
        combineLatestWith(this._tabbar$), // wait for tabbar
        takeUntilDestroyed(),
      )
      .subscribe(([tabToActivate, tabbar]) => {
        if (tabToActivate) {
          this._router.navigate([], {replaceUrl: true, relativeTo: this._route}).then(); // remove 'activeTab' matrix param from URL
          tabbar.activateTab(tabToActivate);
          this._cd.markForCheck();
        }
      });
  }

  @ViewChild(SciTabbarComponent)
  public set injectTabbar(tabbar: SciTabbarComponent) {
    if (tabbar) {
      this._tabbar$.next(tabbar);
      this._tabbar$.complete();
    }
  }
}
