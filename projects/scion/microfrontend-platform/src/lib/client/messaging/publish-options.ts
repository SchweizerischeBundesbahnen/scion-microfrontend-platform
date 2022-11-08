/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Control how to publish a message.
 *
 * @category Messaging
 */
export interface PublishOptions {
  /**
   * Sets headers to pass additional information with a message.
   */
  headers?: Map<string, any>;
  /**
   * Instructs the broker to store this message on the broker as a retained message.
   *
   * Unlike a regular message, a retained message remains in the broker and is delivered to new subscribers, even if
   * they subscribe after the message has been sent.
   *
   * For retained messages, the broker stores one retained message per destination (topic or capability), i.e.,
   * a later sent retained message will replace a previously sent retained message. To delete a retained message,
   * send a retained message without payload to the same destination.
   *
   * For retained requests, the broker stores all retained requests until the requestor unsubscribes.
   */
  retain?: boolean;
}

/**
 * Control how to publish a request in request-response communication.
 *
 * @category Messaging
 */
export interface RequestOptions extends PublishOptions { // eslint-disable-line @typescript-eslint/no-empty-interface
}
