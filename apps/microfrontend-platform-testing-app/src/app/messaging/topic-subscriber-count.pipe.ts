/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Pipe, PipeTransform} from '@angular/core';
import {MessageClient} from '@scion/microfrontend-platform';
import {Observable, of} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Observes the number of subscribers on a topic.
 */
@Pipe({name: 'appTopicSubscriberCount$', standalone: true})
export class TopicSubscriberCountPipe implements PipeTransform {

  public transform(topic: string): Observable<number> {
    if (!topic) {
      return of(0);
    }

    return Beans.get(MessageClient).subscriberCount$(topic);
  }
}
