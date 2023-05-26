/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Capability, Intention} from '@scion/microfrontend-platform';

/**
 * Returns manifest objects that match given filter text in the type or qualifier.
 */
export function filterManifestObjects<T extends Capability | Intention>(manifestObjects: T[], filter: string): T[] {
  if (!manifestObjects) {
    return [];
  }
  if (!filter) {
    return manifestObjects;
  }

  const tokens = tokenize(filter);
  return manifestObjects.filter(manifestObject => {
    const manifestObjectString = stringifyManifestObject(manifestObject);
    return tokens.every(token => manifestObjectString.toLowerCase().includes(token.toLowerCase()));
  });
}

function stringifyManifestObject(manifestObject: Capability | Intention): string {
  const keys = Object.keys(manifestObject.qualifier || {}).join('');
  const values = Object.values(manifestObject.qualifier || {}).join('');
  return `${manifestObject.type}${keys}${values}`;
}

function tokenize(filter: string): string[] {
  if (!filter) {
    return [];
  }

  return filter
    .split(/\s+/)
    .filter(Boolean);
}
