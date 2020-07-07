/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { Component, OnDestroy } from '@angular/core';
import { MicrofrontendPlatform } from '@scion/microfrontend-platform';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {

  public ngOnDestroy(): void {
    MicrofrontendPlatform.destroy().then(); // Platform is started in {@link PlatformInitializer}
  }
}
