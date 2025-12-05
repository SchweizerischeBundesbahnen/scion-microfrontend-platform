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
import {ACTIVATION_CONTEXT, ActivationContext, APP_IDENTITY, ContextService, MessageClient, MessageHeaders} from '@scion/microfrontend-platform';
import {TestingAppTopics} from '../testing-app.topics';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Module which operates as activator.
 *
 * Note: This module is loaded only if loading the host app with the query parameter 'manifestClassifier=activator-readiness' into the browser.
 */
@NgModule({})
export default class ActivatorReadinessModule {

  constructor() {
    const symbolicName = Beans.get<string>(APP_IDENTITY);
    const randomDelay = 1000 + Math.floor(Math.random() * 3000); // range: [1s, 4s); >=1s to exceed the 'activatorLoadTimeout' timeout of app3 [app3#activatorLoadTimeout=800ms] @see environment.ts

    console.log(`[testing] Delay the readiness signaling of the app '${symbolicName}' by ${randomDelay}ms.`);
    setTimeout(() => this.installPingReplierAndSignalReady(), randomDelay);
  }

  /**
   * Installs a request-replier to respond to ping-requests and signals ready.
   */
  private async installPingReplierAndSignalReady(): Promise<void> {
    const activationContext = await Beans.get(ContextService).lookup<ActivationContext>(ACTIVATION_CONTEXT);
    if (!activationContext) {
      throw Error('[NullActivatorContextError] Not running in an activator context.');
    }

    const symbolicName = Beans.get<string>(APP_IDENTITY);
    const pingReply = `${symbolicName} [primary: ${activationContext.primary}, X-APP-NAME: ${activationContext.activator.properties['X-APP-NAME']}]`;

    // Subscribe for ping requests.
    Beans.get(MessageClient).observe$(TestingAppTopics.ActivatorPing)
      .subscribe(pingRequest => {
        void Beans.get(MessageClient).publish(pingRequest.headers.get(MessageHeaders.ReplyTo) as string, pingReply);
      });

    // Signal the host platform that this activator is ready.
    void Beans.get(MessageClient).publish(activationContext.activator.properties.readinessTopics as string);
  }
}
