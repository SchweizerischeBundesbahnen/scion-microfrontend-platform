/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {BehaviorSubject, Subject} from 'rxjs';
import {distinctUntilChanged, map, takeUntil} from 'rxjs/operators';
import {MessageClient, takeUntilUnsubscribe} from '../../client/messaging/message-client';
import {MessageHeaders, TopicMessage} from '../../messaging.model';
import {runSafe} from '../../safe-runner';
import {PlatformTopics} from '../../ɵmessaging.model';
import {ClientRegistry} from '../client-registry/client.registry';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {Client} from '../client-registry/client';

/**
 * Tracks the focus across microfrontends and answers {@link PlatformTopics.IsFocusWithin} requests.
 *
 * @see FocusInEventDispatcher
 * @see FocusMonitor
 * @ignore
 */
export class FocusTracker implements PreDestroy {

  private _destroy$ = new Subject<void>();
  private _focusOwner$ = new BehaviorSubject<Client | undefined>(undefined);

  constructor() {
    this.monitorFocusInEvents();
    this.replyToIsFocusWithinRequests();
  }

  /**
   * Monitors when a client gains the focus.
   */
  private monitorFocusInEvents(): void {
    Beans.get(MessageClient).observe$<void>(PlatformTopics.FocusIn)
      .pipe(
        map(event => event.headers.get(MessageHeaders.ClientId)),
        distinctUntilChanged(),
        takeUntil(this._destroy$),
      )
      .subscribe(clientId => runSafe(() => {
        this._focusOwner$.next(Beans.get(ClientRegistry).getByClientId(clientId) || undefined);
      }));
  }

  /**
   * Replies to 'focus-within' requests.
   */
  private replyToIsFocusWithinRequests(): void {
    Beans.get(MessageClient).observe$<void>(PlatformTopics.IsFocusWithin)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<void>) => runSafe(() => {
        const clientId = request.headers.get(MessageHeaders.ClientId);
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);

        this._focusOwner$
          .pipe(
            map(focusOwner => this.isFocusWithin(clientId, focusOwner)),
            distinctUntilChanged(),
            takeUntilUnsubscribe(replyTo),
            takeUntil(this._destroy$),
          )
          .subscribe((isFocusWithin: boolean) => { // eslint-disable-line rxjs/no-nested-subscribe
            Beans.get(MessageClient).publish(replyTo, isFocusWithin);
          });
      }));
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
    this._destroy$.next();
  }
}
