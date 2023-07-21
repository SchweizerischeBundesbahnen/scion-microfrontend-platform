/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {IntentMessage, MessageHeaders, ResponseStatusCodes} from '../../messaging.model';
import {Beans} from '@scion/toolkit/bean-manager';
import {MicrofrontendCapability, PlatformCapabilityTypes} from '../../platform.model';
import {Handler, IntentInterceptor} from '../message-broker/message-interception';
import {OutletRouter, ROUTING_CONTEXT_MESSAGE_HEADER, ROUTING_CONTEXT_OUTLET} from '../../client/router-outlet/outlet-router';
import {NavigationOptions} from '../../client/router-outlet/metadata';
import {MessageClient} from '../../client/messaging/message-client';
import {Dictionaries} from '@scion/toolkit/util';
import {ApplicationRegistry} from '../application-registry';
import {PRIMARY_OUTLET} from '../../client/router-outlet/router-outlet.element';

/**
 * Handles microfrontend intents, instructing the {@link OutletRouter} to navigate to the microfrontend of the resolved microfrontend capability.
 *
 * Microfrontend intents are handled in this interceptor in order to support microfrontends not using the SCION Microfrontend Platform.
 * They are not transported to the providing application.
 *
 * @internal
 */
export class MicrofrontendIntentNavigator implements IntentInterceptor {

  /**
   * Microfrontend intents are handled in this interceptor and then swallowed.
   */
  public intercept(intentMessage: IntentMessage, next: Handler<IntentMessage>): Promise<void> {
    if (intentMessage.intent.type === PlatformCapabilityTypes.Microfrontend) {
      return this.consumeMicrofrontendIntent(intentMessage);
    }
    else {
      return next.handle(intentMessage);
    }
  }

  private async consumeMicrofrontendIntent(message: IntentMessage<NavigationOptions>): Promise<void> {
    const replyTo = message.headers.get(MessageHeaders.ReplyTo);
    await this.navigate(message);
    await Beans.get(MessageClient).publish(replyTo, null, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
  }

  private async navigate(message: IntentMessage<NavigationOptions>): Promise<void> {
    const microfrontendCapability = message.capability as MicrofrontendCapability;
    const options = message.body;
    const intent = message.intent;

    const microfrontendPath = microfrontendCapability.properties?.path;
    if (microfrontendPath === undefined || microfrontendPath === null) { // empty path is a valid path
      throw Error(`[OutletRouterError][NullPathError] Microfrontend capability has no path to the microfrontend defined. [capability=${JSON.stringify(microfrontendCapability)}]`);
    }
    const appSymbolicName = microfrontendCapability.metadata!.appSymbolicName;
    const application = Beans.get(ApplicationRegistry).getApplication(appSymbolicName, {orElse: null});
    if (!application) {
      throw Error(`[OutletRouterError][NullApplicationError] Unexpected error. No application found with the symbolic name "${appSymbolicName}".`);
    }

    await Beans.get(OutletRouter).navigate(microfrontendPath, {
      ...options,
      outlet: this.resolveTargetOutlet(message),
      relativeTo: application.baseUrl,
      params: {...intent.qualifier, ...Dictionaries.coerce(intent.params)},
    });
  }

  /**
   * Resolves the target outlet in the following order:
   *
   * - Outlet as specified by navigator via {@link NavigationOptions#outlet}.
   * - Preferred outlet as specified in the microfrontend capability.
   * - Current outlet if navigating in the context of an outlet.
   * - {@link PRIMARY_OUTLET primary} outlet.
   */
  private resolveTargetOutlet(message: IntentMessage<NavigationOptions>): string {
    const microfrontendCapability = message.capability as MicrofrontendCapability;
    const options = message.body;

    if (options?.outlet) {
      return options.outlet;
    }
    if (microfrontendCapability.properties.outlet) {
      return microfrontendCapability.properties.outlet;
    }
    const contextualOutlet = message.headers.get(ROUTING_CONTEXT_MESSAGE_HEADER)?.[ROUTING_CONTEXT_OUTLET];
    if (contextualOutlet) {
      return contextualOutlet;
    }
    return PRIMARY_OUTLET;
  }
}
