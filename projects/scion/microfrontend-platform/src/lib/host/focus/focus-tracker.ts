/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {BehaviorSubject, Subscription} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {MessageClient} from '../../client/messaging/message-client';
import {MessageHeaders} from '../../messaging.model';
import {runSafe} from '../../safe-runner';
import {PlatformTopics} from '../../ɵmessaging.model';
import {ClientRegistry} from '../client-registry/client.registry';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {Client} from '../client-registry/client';

/**
 * Tracks the focus across microfrontends and answers {@link PlatformTopics.IsFocusWithin} and {@link PlatformTopics.HasFocus} requests.
 *
 * @see FocusInEventDispatcher
 * @see FocusMonitor
 * @ignore
 */
export class FocusTracker implements PreDestroy {

  private _focusOwner$ = new BehaviorSubject<Client | undefined>(undefined);
  private _subscriptions = new Set<Subscription>();

  constructor() {
    this._subscriptions.add(this.monitorFocusInEvents());
    this._subscriptions.add(this.replyToIsFocusWithinRequests());
    this._subscriptions.add(this.replyToHasFocusRequests());
  }

  /**
   * Monitors when a client gains the focus.
   */
  private monitorFocusInEvents(): Subscription {
    return Beans.get(MessageClient).observe$<void>(PlatformTopics.FocusIn)
      .pipe(
        map(event => event.headers.get(MessageHeaders.ClientId)),
        distinctUntilChanged(),
      )
      .subscribe(clientId => runSafe(() => {
        this._focusOwner$.next(Beans.get(ClientRegistry).getByClientId(clientId) || undefined);
      }));
  }

  /**
   * Replies to 'focus-within' requests.
   */
  private replyToIsFocusWithinRequests(): Subscription {
    return Beans.get(MessageClient).onMessage<void, boolean>(PlatformTopics.IsFocusWithin, request => {
      const clientId = request.headers.get(MessageHeaders.ClientId);
      return this._focusOwner$
        .pipe(
          map(focusOwner => this.isFocusWithin(clientId, focusOwner)),
          distinctUntilChanged(),
        );
    });
  }

  /**
   * Replies to 'focus' requests.
   */
  private replyToHasFocusRequests(): Subscription {
    return Beans.get(MessageClient).onMessage<void, boolean>(PlatformTopics.HasFocus, request => {
      const clientId = request.headers.get(MessageHeaders.ClientId);
      return this._focusOwner$
        .pipe(
          map(focusOwner => focusOwner?.id === clientId),
          distinctUntilChanged(),
        );
    });
  }

  /**
   * Tests whether the given client has received focus or contains embedded web content that has received focus.
   */
  private isFocusWithin(clientId: string, focusOwner: Client | undefined): boolean {
    for (let client = focusOwner; client !== undefined; client = this.getParentClient(client)) {
      if (client.id === clientId) {
        return true;
      }
    }
    return false;
  }

  private getParentClient(client: Client): Client | undefined {
    if (client.window.parent === client.window) {
      return undefined; // window has no parent as it is the top-level window
    }
    return Beans.get(ClientRegistry).getByWindow(client.window.parent);
  }

  public preDestroy(): void {
    this._subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
