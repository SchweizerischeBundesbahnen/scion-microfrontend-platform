/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {PreferredSizeService} from './preferred-size-service';
import {MessageClient} from '../messaging/public_api';
import {mapToBody} from '../../messaging.model';

export async function reportPreferredSize({scriptPreferredSizeTopic}): Promise<void> { // eslint-disable-line @typescript-eslint/typedef
  await MicrofrontendPlatform.connectToHost('host');
  Beans.get(MessageClient).observe$(scriptPreferredSizeTopic)
    .pipe(mapToBody())
    .subscribe(preferredSize => {
      Beans.get(PreferredSizeService).setPreferredSize(preferredSize);
    });
}

