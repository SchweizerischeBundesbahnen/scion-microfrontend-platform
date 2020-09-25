/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { MessageClient } from '../client/messaging/message-client';

/**
 * Message client used by the platform to send and receive messages.
 *
 * Messages are sent and received on behalf of the platform app {@link PLATFORM_SYMBOLIC_NAME}.
 *
 * @category Platform
 */
export abstract class PlatformMessageClient extends MessageClient {
}
