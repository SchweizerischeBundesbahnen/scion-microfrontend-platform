/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Manifest} from '../../platform.model';

/**
 * Allows serving a manifest.
 */
export class ManifestFixture {

  public url: string | null = null;

  constructor(public readonly manifest: Manifest) {
  }

  /**
   * Serves the manifest passed to the constructor and returns its URL.
   */
  public serve(): string {
    this.url = URL.createObjectURL(new Blob([JSON.stringify(this.manifest)], {type: 'application/json'}));
    return this.url;
  }

  /**
   * Stops serving the manifest.
   */
  public stop(): void {
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
  }
}
