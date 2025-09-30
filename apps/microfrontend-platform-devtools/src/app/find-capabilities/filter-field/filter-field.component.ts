/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, HostListener, inject, input, linkedSignal, NgZone, Output, signal, untracked, ViewChild} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {UUID} from '@scion/toolkit/uuid';
import {KeyValuePair, LogicalOperator} from './filter-field';
import {CdkMonitorFocus, FocusOrigin} from '@angular/cdk/a11y';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-filter-field',
  templateUrl: './filter-field.component.html',
  styleUrls: ['./filter-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CdkMonitorFocus,
    SciMaterialIconDirective,
  ],
})
export class FilterFieldComponent {

  public readonly title = input.required<string>();
  public readonly type = input<'value' | 'key-value'>('value');
  public readonly initialLogicalOperator = input<LogicalOperator>(undefined, {alias: 'logicalOperator'});
  public readonly placeholder = input('Value');
  public readonly autocompleteKeys = input<string[]>();
  public readonly autocompleteValues = input<string[]>();
  public readonly initialFilters = input<KeyValuePair[] | string[]>();

  private readonly _cdRef = inject(ChangeDetectorRef);
  private readonly _zone = inject(NgZone);
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _filters = signal(new Set<KeyValuePair>());

  protected readonly logicalOperator = linkedSignal(() => this.initialLogicalOperator());
  protected readonly autocompleteKeysDatalistId = UUID.randomUUID(); // generate random id for autocomplete list in order to support multiple filter fields in the same document
  protected readonly autocompleteValuesDatalistId = UUID.randomUUID(); // generate random id for autocomplete list in order to support multiple filter fields in the same document
  protected readonly OR = 'or';
  protected readonly AND = 'and';

  @Output()
  public addValueFilter = new EventEmitter<string>();

  @Output()
  public addKeyValueFilter = new EventEmitter<KeyValuePair>();

  @Output()
  public removeValueFilter = new EventEmitter<string>();

  @Output()
  public removeKeyValueFilter: EventEmitter<KeyValuePair> = new EventEmitter<KeyValuePair>();

  @Output()
  public changeLogicalOperator: EventEmitter<LogicalOperator> = new EventEmitter<LogicalOperator>();

  @ViewChild('key', {read: ElementRef})
  private _keyElement: ElementRef<HTMLElement> | undefined;

  public keyFormControl = this._formBuilder.control('');

  @ViewChild('value', {read: ElementRef})
  private _valueElement: ElementRef<HTMLElement> | undefined;

  public valueFormControl = this._formBuilder.control('');

  public showFilter = false;

  constructor() {
    effect(() => {
      const initialFilters = this.initialFilters();
      untracked(() => {
        return initialFilters?.forEach(it => {
          this._filters.update(filters => (typeof it === 'string') ? filters.add({value: it}) : filters.add(it));
        });
      });
    });
  }

  @HostListener('keydown.escape')
  public onEscape(): void {
    this.showFilter = false;
  }

  public onFocusChange(origin: FocusOrigin): void {
    if (origin === null) {
      this.showFilter = false;
      // Workaround for the fact that (cdkFocusChange) emits outside NgZone.
      this._zone.run(() => this._cdRef.markForCheck());
    }
  }

  protected get filters(): KeyValuePair[] {
    return Array.from(this._filters().values());
  }

  protected onLogicalOperatorClick(logicalOperator: LogicalOperator): void {
    this.changeLogicalOperator.emit(logicalOperator);
  }

  protected onNewFilterClick(): void {
    this.showFilter = true;
    this._cdRef.detectChanges();
    this.focusInput();
  }

  protected onAddFilterClick(): void {
    if (this.isAddButtonDisabled()) {
      return;
    }
    const newFilter = this.add(this.keyFormControl.value, this.valueFormControl.value);
    if (newFilter) {
      this.addValueFilter.emit(newFilter.value);
      this.addKeyValueFilter.emit(newFilter);
    }
    this.keyFormControl.reset();
    this.valueFormControl.reset();
    this.focusInput();
  }

  protected onRemoveFilterClick(removedFilter: KeyValuePair): void {
    this._filters().delete(removedFilter);
    this.removeValueFilter.emit(removedFilter.value);
    this.removeKeyValueFilter.emit(removedFilter);
  }

  protected isAddButtonDisabled(): boolean {
    if (this.type() === 'value') {
      return !this.valueFormControl.value;
    }
    return !this.keyFormControl.value && !this.valueFormControl.value;
  }

  private add(key: string, value: string): KeyValuePair | false {
    const entry = {key: this.type() === 'value' ? undefined : key, value};

    if (!this.hasEntry(entry)) {
      this._filters().add(entry);
      return entry;
    }
    return false;
  }

  private hasEntry(entry: KeyValuePair): boolean {
    return !!this.filters.find((it: KeyValuePair) => it.key === entry.key && it.value === entry.value);
  }

  private focusInput(): void {
    if (this.type() === 'value') {
      this._valueElement!.nativeElement.focus();
    }
    else if (this.type() === 'key-value') {
      this._keyElement!.nativeElement.focus();
    }
  }
}
