/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'app-context-entry',
  templateUrl: './context-entry.component.html',
  styleUrls: ['./context-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextEntryComponent {

  public readonly name = input.required<string>();
  public readonly value = input.required({transform: (value: unknown): unknown => typeof value === 'object' ? JSON.stringify(value) : value});
}
