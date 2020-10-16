/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { OperatorFunction } from 'rxjs';
import { Capability, Intention, ManifestObject } from '@scion/microfrontend-platform';
import { map } from 'rxjs/operators';

export function splitFilter(filter: string): string[] {
  if (!filter) {
    return [];
  }

  return filter.toLowerCase()
    .split(' ')
    .filter(it => it !== '');
}

export function filterCapabilities(): OperatorFunction<[Capability[], string[]], Capability[]> {
  return map(([capabilities, filter]) => filterCapabilitiesByTypeAndQualifier(capabilities, filter));
}

export function filterCapabilitiesByTypeAndQualifier(capabilities: Capability[], filters: string[]): Capability[] {
  if (!capabilities) {
    return [];
  }

  if (!filters.length) {
    return capabilities || [];
  }

  return capabilities.filter(capability => filterManifestObject(capability, filters));
}

export function filterIntentions(): OperatorFunction<[Intention[], string[]], Intention[]> {
  return map(([intentions, filter]) => filterIntentionsByTypeAndQualifier(intentions, filter));
}

export function filterIntentionsByTypeAndQualifier(intentions: Intention[], filters: string[]): Intention[] {
  if (!intentions) {
    return [];
  }

  if (!filters.length) {
    return intentions;
  }

  return intentions.filter(intention => filterManifestObject(intention, filters));
}

function filterManifestObject(manifestObject: ManifestObject, filters: string[]): boolean {
  const manifestObjectString = stringifyManifestObject(manifestObject);
  return filters.every(filter => manifestObjectString.toLowerCase().includes(filter));
}

function stringifyManifestObject(manifestObject: ManifestObject): string {
  const keys = Object.keys(manifestObject.qualifier || {}).join('');
  const values = Object.values(manifestObject.qualifier || {}).join('');
  return `${manifestObject.type}${keys}${values}`.toLowerCase();
}
