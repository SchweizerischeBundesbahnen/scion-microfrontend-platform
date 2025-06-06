/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, inject, Input, NgZone, OnInit, Output, ViewChild} from '@angular/core';
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
export class FilterFieldComponent implements OnInit {

  private readonly _cdRef = inject(ChangeDetectorRef);
  private readonly _zone = inject(NgZone);
  private readonly _formBuilder = inject(NonNullableFormBuilder);

  public readonly autocompleteKeysDatalistId = UUID.randomUUID();  // generate random id for autocomplete list in order to support multiple filter fields in the same document
  public readonly autocompleteValuesDatalistId = UUID.randomUUID();  // generate random id for autocomplete list in order to support multiple filter fields in the same document
  public readonly OR = 'or';
  public readonly AND = 'and';

  @Input({required: true})
  public title!: string;

  @Input()
  public type: 'value' | 'key-value' = 'value';

  @Input()
  public logicalOperator?: LogicalOperator | undefined;

  @Input()
  public placeholder = 'Value';

  @Input()
  public autocompleteKeys?: string[] | undefined;

  @Input()
  public autocompleteValues?: string[] | undefined;

  @Input()
  public initialFilters?: KeyValuePair[] | string[] | undefined;

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

  private _filters = new Set<KeyValuePair>();

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

  public ngOnInit(): void {
    this.initialFilters?.forEach(it => (typeof it === 'string') ? this._filters.add({value: it}) : this._filters.add(it));
  }

  public get filters(): KeyValuePair[] {
    return Array.from(this._filters.values());
  }

  public onLogicalOperatorClick(logicalOperator: LogicalOperator): void {
    this.logicalOperator = logicalOperator;
    this.changeLogicalOperator.emit(logicalOperator);
  }

  public onNewFilterClick(): void {
    this.showFilter = true;
    this._cdRef.detectChanges();
    this.focusInput();
  }

  public onAddFilterClick(): void {
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

  public onRemoveFilterClick(removedFilter: KeyValuePair): void {
    this._filters.delete(removedFilter);
    this.removeValueFilter.emit(removedFilter.value);
    this.removeKeyValueFilter.emit(removedFilter);
  }

  public isAddButtonDisabled(): boolean {
    if (this.isTypeValue()) {
      return !this.valueFormControl.value;
    }
    return !this.keyFormControl.value && !this.valueFormControl.value;
  }

  public isTypeValue(): boolean {
    return this.type === 'value';
  }

  public isTypeKeyValue(): boolean {
    return this.type === 'key-value';
  }

  private add(key: string, value: string): KeyValuePair | false {
    const entry = {key: this.isTypeValue() ? undefined : key, value};

    if (!this.hasEntry(entry)) {
      this._filters.add(entry);
      return entry;
    }
    return false;
  }

  private hasEntry(entry: KeyValuePair): boolean {
    return !!this.filters.find((it: KeyValuePair) => it.key === entry.key && it.value === entry.value);
  }

  private focusInput(): void {
    if (this.isTypeValue()) {
      this._valueElement!.nativeElement.focus();
    }
    else if (this.isTypeKeyValue()) {
      this._keyElement!.nativeElement.focus();
    }
  }
}
