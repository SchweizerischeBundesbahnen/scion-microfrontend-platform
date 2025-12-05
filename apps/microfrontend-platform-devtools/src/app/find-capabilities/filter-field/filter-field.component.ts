/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, ElementRef, HostListener, inject, input, NgZone, output, Signal, signal, untracked, viewChild} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {UUID} from '@scion/toolkit/uuid';
import {KeyValuePair, LogicalOperator} from './filter-field';
import {CdkMonitorFocus, FocusOrigin} from '@angular/cdk/a11y';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {toSignal} from '@angular/core/rxjs-interop';

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
  public readonly logicalOperator = input<LogicalOperator>();
  public readonly placeholder = input('Value');
  public readonly autocompleteKeys = input<string[]>();
  public readonly autocompleteValues = input<string[]>();
  public readonly initialFilters = input<KeyValuePair[] | string[]>();
  public readonly addValueFilter = output<string>();
  public readonly addKeyValueFilter = output<KeyValuePair>();
  public readonly removeValueFilter = output<string>();
  public readonly removeKeyValueFilter = output<KeyValuePair>();
  public readonly changeLogicalOperator = output<LogicalOperator>();

  private readonly _cdRef = inject(ChangeDetectorRef);
  private readonly _zone = inject(NgZone);
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _keyElement = viewChild('key', {read: ElementRef<HTMLElement>});
  private readonly _valueElement = viewChild('value', {read: ElementRef<HTMLElement>});

  protected readonly keyFormControl = this._formBuilder.control('');
  protected readonly valueFormControl = this._formBuilder.control('');
  protected readonly autocompleteKeysDatalistId = UUID.randomUUID(); // generate random id for autocomplete list in order to support multiple filter fields in the same document
  protected readonly autocompleteValuesDatalistId = UUID.randomUUID(); // generate random id for autocomplete list in order to support multiple filter fields in the same document
  protected readonly OR = 'or';
  protected readonly AND = 'and';
  protected readonly filters = signal(new Array<KeyValuePair>());
  protected readonly showFilter = signal(false);
  protected readonly isAddButtonDisabled = this.computeIsAddButtonDisabled(); // `keyFormControl` and `valueFormControl` must be defined before computing the signal.

  constructor() {
    this.computeFilters();
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.showFilter.set(false);
  }

  protected onFocusChange(origin: FocusOrigin): void {
    if (origin === null) {
      this.showFilter.set(false);
      // Workaround for the fact that (cdkFocusChange) emits outside NgZone.
      this._zone.run(() => this._cdRef.markForCheck());
    }
  }

  protected onLogicalOperatorClick(logicalOperator: LogicalOperator): void {
    this.changeLogicalOperator.emit(logicalOperator);
  }

  protected onNewFilterClick(): void {
    this.showFilter.set(true);
    this._cdRef.detectChanges();
    this.focusInput();
  }

  protected onAddFilterClick(): void {
    if (this.isAddButtonDisabled()) {
      return;
    }
    const newFilter = this.add({key: this.keyFormControl.value, value: this.valueFormControl.value});
    if (newFilter) {
      this.addValueFilter.emit(newFilter.value!);
      this.addKeyValueFilter.emit(newFilter);
    }
    this.keyFormControl.reset();
    this.valueFormControl.reset();
    this.focusInput();
  }

  protected onRemoveFilterClick(removedFilter: KeyValuePair): void {
    this.filters.update(filters => {
      const newFilters = [...filters];
      newFilters.splice(newFilters.findIndex(element => element === removedFilter), 1);
      return newFilters;
    });
    this.removeValueFilter.emit(removedFilter.value!);
    this.removeKeyValueFilter.emit(removedFilter);
  }

  private computeFilters(): void {
    effect(() => {
      const initialFilters = this.initialFilters();

      untracked(() => initialFilters?.forEach(filter => this.add(filter)));
    });
  }

  private computeIsAddButtonDisabled(): Signal<boolean> {
    const key = toSignal(this.keyFormControl.valueChanges, {initialValue: this.keyFormControl.value});
    const value = toSignal(this.valueFormControl.valueChanges, {initialValue: this.valueFormControl.value});

    return computed(() => {
      if (this.type() === 'value') {
        return !value();
      }
      return !key() && !value();
    });
  }

  private add(filter: KeyValuePair | string): KeyValuePair | false {
    const entry = typeof filter === 'string' ? {key: undefined, value: filter} : {key: this.type() === 'value' ? undefined : filter.key, value: filter.value};

    if (!this.hasEntry(entry)) {
      this.filters.update(filters => {
        const newFilters = [...filters];
        newFilters.push(entry);
        return newFilters;
      });
      return entry;
    }
    return false;
  }

  private hasEntry(entry: string | KeyValuePair): boolean {
    return !!this.filters().find((it: KeyValuePair) => {
      if (typeof entry === 'string') {
        return it.value === entry;
      }
      return it.key === entry.key && it.value === entry.value;
    });
  }

  private focusInput(): void {
    if (this.type() === 'value') {
      (this._valueElement()!.nativeElement as HTMLElement).focus();
    }
    else if (this.type() === 'key-value') {
      (this._keyElement()!.nativeElement as HTMLElement).focus();
    }
  }
}
