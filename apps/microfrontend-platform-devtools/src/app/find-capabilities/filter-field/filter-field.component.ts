/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UUID } from '@scion/toolkit/uuid';
import { KeyValuePair, LogicalOperator } from './filter-field';
import { FocusOrigin } from '@angular/cdk/a11y';

@Component({
  selector: 'devtools-filter-field',
  templateUrl: './filter-field.component.html',
  styleUrls: ['./filter-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterFieldComponent implements OnInit {
  public autocompleteKeysDatalistId = UUID.randomUUID();  // generate random id for autocomplete list in order to support multiple filter fields in the same document
  public autocompleteValuesDatalistId = UUID.randomUUID();  // generate random id for autocomplete list in order to support multiple filter fields in the same document
  public readonly OR = 'or';
  public readonly AND = 'and';

  @Input()
  public title: string;

  @Input()
  public type: 'value' | 'key-value' = 'value';

  @Input()
  public logicalOperator: LogicalOperator;

  @Input()
  public placeholder = 'Value';

  @Input()
  public autocompleteKeys;

  @Input()
  public autocompleteValues;

  @Input()
  public initialFilters: KeyValuePair[] | string[];

  @Output()
  public addValueFilter: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public addKeyValueFilter: EventEmitter<KeyValuePair> = new EventEmitter<KeyValuePair>();

  @Output()
  public removeValueFilter: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public removeKeyValueFilter: EventEmitter<KeyValuePair> = new EventEmitter<KeyValuePair>();

  @Output()
  public changeLogicalOperator: EventEmitter<LogicalOperator> = new EventEmitter<LogicalOperator>();

  @ViewChild('key', {read: ElementRef})
  private _keyElement: ElementRef<HTMLElement>;

  public keyFC = new FormControl();

  @ViewChild('value', {read: ElementRef})
  private _valueElement: ElementRef<HTMLElement>;

  public valueFC = new FormControl();

  public showFilter = false;

  private _filters = new Set<KeyValuePair>();

  constructor(private _cdRef: ChangeDetectorRef, private _zone: NgZone) {
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
    const newFilter = this.add(this.keyFC.value, this.valueFC.value);
    if (newFilter) {
      this.addValueFilter.emit(newFilter.value);
      this.addKeyValueFilter.emit(newFilter);
    }
    this.keyFC.reset();
    this.valueFC.reset();
  }

  public onRemoveFilterClick(removedFilter: KeyValuePair): void {
    this._filters.delete(removedFilter);
    this.removeValueFilter.emit(removedFilter.value);
    this.removeKeyValueFilter.emit(removedFilter);
  }

  public isAddButtonDisabled(): boolean {
    if (this.isTypeValue()) {
      return !this.valueFC.value;
    }
    return !this.keyFC.value && !this.valueFC.value;
  }

  public isTypeValue(): boolean {
    return this.type === 'value';
  }

  public isTypeKeyValue(): boolean {
    return this.type === 'key-value';
  }

  private add(key: string, value: string): KeyValuePair {
    this.focusInput();
    if (this.isTypeValue() && !this.hasEntry({value})) {
      this._filters.add({value});
      return {value};
    }
    else if (this.isTypeKeyValue()) {
      const entry = {key, value};
      if (!this.hasEntry(entry)) {
        this._filters.add(entry);
        return entry;
      }
    }
    return undefined;
  }

  private hasEntry(entry: KeyValuePair): boolean {
    return !!this.filters.find((it: KeyValuePair) => it.key === entry.key && it.value === entry.value);
  }

  private focusInput(): void {
    if (this.isTypeValue()) {
      this._valueElement.nativeElement.focus();
    }
    else if (this.isTypeKeyValue()) {
      this._keyElement.nativeElement.focus();
    }
  }
}
