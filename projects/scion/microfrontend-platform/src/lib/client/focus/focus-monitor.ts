/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Observable} from 'rxjs';
import {PlatformTopics} from '../../ɵmessaging.model';
import {MessageClient} from '../messaging/message-client';
import {mapToBody} from '../../messaging.model';
import {Beans} from '@scion/toolkit/bean-manager';

/**
 * Allow observing whether the current microfrontend has received focus or contains embedded web content that has received focus.
 *
 * @category Focus
 */
export class FocusMonitor {

  /**
   * Observable that emits when the current microfrontend or any of its child microfrontends has gained or lost focus.
   * The Observable does not emit while the focus remains within this microfrontend or any of its child microfrontends.
   * Upon subscription, the Observable emits the current focus-within state, and then continuously emits when it changes.
   * It never completes.
   *
   * This Observable is like the `:focus-within` CSS pseudo-class but operates across iframe boundaries.
   * For example, it can be useful when implementing overlays that close upon focus loss.
   *
   * Note that this Observable emits only for microfrontends that are connected to the platform as registered micro app.
   *
   * See also the `onfocuswithin` event triggered by `<sci-router-outlet>` when embedded content has gained or lost focus.
   */
  public readonly focusWithin$: Observable<boolean> = Beans.get(MessageClient).request$<boolean>(PlatformTopics.IsFocusWithin).pipe(mapToBody());

  /**
   * Observable that emits when the current microfrontend has gained or lost focus.
   *
   * Upon subscription, the Observable emits the current focus state, and then continuously emits when it changes.
   * It never completes.
   */
  public readonly focus$: Observable<boolean> = Beans.get(MessageClient).request$<boolean>(PlatformTopics.HasFocus).pipe(mapToBody());
}
