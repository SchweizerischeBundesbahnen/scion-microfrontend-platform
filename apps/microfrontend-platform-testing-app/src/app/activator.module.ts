/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { NgModule } from '@angular/core';
import { ACTIVATION_CONTEXT, ActivationContext, Beans, ContextService, MessageClient, MessageHeaders, MicroApplicationConfig } from '@scion/microfrontend-platform';
import { TestingAppTopics } from './testing-app.topics';
import { RouterModule } from '@angular/router';

/**
 * Module which operates as activator.
 *
 * Note: This module is loaded only if loading the host app with the query parameter 'manifestClassifier=activator' into the browser.
 */
@NgModule({
  imports: [
    RouterModule.forChild([]),
  ],
})
export class ActivatorModule {

  constructor() {
    const symbolicName = Beans.get(MicroApplicationConfig).symbolicName;
    const randomDelay = Math.floor(Math.random() * 10000);

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
    const symbolicName = Beans.get(MicroApplicationConfig).symbolicName;
    const pingReply = `${symbolicName} [primary: ${activationContext.primary}, X-APP-NAME: ${activationContext.activator.properties['X-APP-NAME']}]`;

    // Subscribe for ping requests.
    Beans.get(MessageClient).onMessage$(TestingAppTopics.ActivatorPing)
      .subscribe(pingRequest => {
        Beans.get(MessageClient).publish(pingRequest.headers.get(MessageHeaders.ReplyTo), pingReply);
      });

    // Signal the host platform that this activator is ready.
    Beans.get(MessageClient).publish(activationContext.activator.properties.readinessTopics as string);
  }
}
