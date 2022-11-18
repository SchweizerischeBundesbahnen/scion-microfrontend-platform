/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Declares topics of the testing app.
 */
export namespace TestingAppTopics {
  /**
   * The host app sends a ping request to the activators when started the platform.
   */
  export const ActivatorPing = 'activators/ping';

  /**
   * Computes the topic to which a message can be sent to update the context of an outlet.
   */
  export function routerOutletContextUpdateTopic(outletName: string, contextValueKey: string): string {
    return `testing-app/sci-router-outlets/${outletName}/context/${contextValueKey}`;
  }
}
