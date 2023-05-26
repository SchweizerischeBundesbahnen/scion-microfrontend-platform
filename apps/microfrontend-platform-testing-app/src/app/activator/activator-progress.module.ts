/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {NgModule} from '@angular/core';
import {ACTIVATION_CONTEXT, ActivationContext, APP_IDENTITY, ContextService, MessageClient} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Module which operates as activator.
 *
 * Note: This module is loaded only if loading the host app with the query parameter 'manifestClassifier=activator-progress' into the browser.
 */
@NgModule({})
export default class ActivatorProgressModule {

  constructor() {
    const symbolicName = Beans.get<string>(APP_IDENTITY);
    const randomDelay = 1000 + Math.floor(Math.random() * 3000); // range: [1s, 4s); >=1s to exceed the 'activatorLoadTimeout' timeout of app3 [app3#activatorLoadTimeout=800ms] @see environment.ts

    console.log(`[testing] Delay the readiness signaling of the app '${symbolicName}' by ${randomDelay}ms.`);
    setTimeout(() => this.signalReadiness(), randomDelay);
  }

  /**
   * Signals ready.
   */
  private async signalReadiness(): Promise<void> {
    const activationContext = await Beans.get(ContextService).lookup<ActivationContext>(ACTIVATION_CONTEXT);
    if (!activationContext) {
      throw Error('[NullActivatorContextError] Not running in an activator context.');
    }

    // Signal the host platform that this activator is ready.
    const readinessTopics = activationContext.activator.properties.readinessTopics;
    if (readinessTopics) {
      Beans.get(MessageClient).publish(readinessTopics as string);
    }
  }
}
