/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {coerceBooleanProperty, coerceNumberProperty} from '@angular/cdk/coercion';

/**
 * Parses the typed string values of given object to its actual type.
 *
 * Supported typed values:
 * - '<undefined>' => undefined
 * - '<null>' => null
 * - '<number>123</number>' => 123
 * - '<boolean>true</boolean>' => true
 * - '<string>value</string>' => 'value'
 * - '<json>{"key": "value"}</json>' => {"key": "value"}
 * - 'value' => 'value'
 */
export function parseTypedValues(object: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined;
export function parseTypedValues(object: Map<string, unknown> | null | undefined): Map<string, unknown> | null | undefined;
export function parseTypedValues(object: Record<string, unknown> | Map<string, unknown> | null | undefined): Record<string, unknown> | Map<string, unknown> | null | undefined {
  if (object === null || object === undefined) {
    return object;
  }
  else if (object instanceof Map) {
    return Array
      .from(object.entries())
      .reduce((acc, [key, value]) => acc.set(key, parseTypedValue(value)), new Map<string, unknown>());
  }
  else {
    return Object.entries(object).reduce((acc, [key, value]) => {
      acc[key] = parseTypedValue(value);
      return acc;
    }, {} as Record<string, unknown>);
  }
}

/**
 * Parses the typed string value to its actual type.
 *
 * Supported typed values:
 * - '<undefined>' => undefined
 * - '<null>' => null
 * - '<number>123</number>' => 123
 * - '<boolean>true</boolean>' => true
 * - '<string>value</string>' => 'value'
 * - '<json>{"key": "value"}</json>' => {"key": "value"}
 * - 'value' => 'value'
 */
export function parseTypedValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (value === '<null>') {
    return null;
  }
  if (value === '<undefined>') {
    return undefined;
  }

  const paramMatch = /<(?<type>.+)>(?<value>.+)<\/\k<type>>/.exec(value);
  switch (paramMatch?.groups!['type']) {
    case 'number': {
      return coerceNumberProperty(paramMatch.groups['value']);
    }
    case 'boolean': {
      return coerceBooleanProperty(paramMatch.groups['value']);
    }
    case 'string': {
      return paramMatch.groups['value'];
    }
    case 'json': {
      return JSON.parse(paramMatch.groups['value']!);
    }
    default: {
      return value;
    }
  }
}
