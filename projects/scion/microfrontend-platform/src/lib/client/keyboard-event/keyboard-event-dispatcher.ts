/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { fromEvent, merge, noop, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { MessageClient } from '../messaging/message-client';
import { ContextService } from '../context/context-service';
import { KEYSTROKE_CONTEXT_NAME_PREFIX, OUTLET_CONTEXT, OutletContext, RouterOutlets } from '../router-outlet/router-outlet.element';
import { Keystroke } from './keystroke';
import { Maps } from '@scion/toolkit/util';
import { runSafe } from '../../safe-runner';
import { Beans, PreDestroy } from '@scion/toolkit/bean-manager';

/**
 * Propagates keyboard events for keystrokes registered in the current context or any parent contexts.
 *
 * This dispatcher listens to keyboard events for keystrokes registered in parent contexts and publishes
 * them as {@link KeyboardEventInit} events to the topic {@link RouterOutlets.keyboardEventTopic}.
 *
 * @ignore
 */
export class KeyboardEventDispatcher implements PreDestroy {

  private _destroy$ = new Subject<void>();
  private _keystrokesChange$ = new Subject<void>();
  private _whenOutletIdentity: Promise<string>;
  private _keyboardEvents$ = new Subject<KeyboardEvent>();

  constructor() {
    this._whenOutletIdentity = this.lookupOutletIdentity();
    this.installKeyboardEventListener();
    this.installKeystrokeListener();
  }

  /**
   * Installs a listener for keyboard events.
   *
   * IMPORTANT:
   * Always subscribe to DOM events during event dispatcher construction. Event dispatchers are eagerly created on platform startup.
   * Frameworks like Angular usually connect to the platform outside their change detection zone in order to avoid triggering change detection for unrelated DOM events.
   */
  private installKeyboardEventListener(): void {
    merge(fromEvent<KeyboardEvent>(document, 'keydown'), fromEvent<KeyboardEvent>(document, 'keyup'))
      .pipe(
        filter(event => event.bubbles && !!event.key),
        takeUntil(this._destroy$),
      )
      .subscribe(event => this._keyboardEvents$.next(event));
  }

  private installKeystrokeListener(): void {
    Beans.get(ContextService).names$()
      .pipe(takeUntil(this._destroy$))
      .subscribe((contextNames: Set<string>) => runSafe(() => {
        this._keystrokesChange$.next();

        Array.from(contextNames)
          .filter(contextName => contextName.startsWith(KEYSTROKE_CONTEXT_NAME_PREFIX))
          .map(keystrokeContextName => keystrokeContextName.substring(KEYSTROKE_CONTEXT_NAME_PREFIX.length))
          .reduce((keystrokes, keystroke) => { // group keystrokes by event type (keydown, keyup)
            const {eventType, parts} = Keystroke.fromString(keystroke);
            return Maps.addSetValue(keystrokes, eventType, parts);
          }, new Map<string, Set<string>>())
          .forEach((keystrokes, eventType) => {
            this.installKeyboardEventDispatcher(eventType, keystrokes);
          });
      }));
  }

  /**
   * Listens to keyboard events matching the given keystrokes and publishes them as {@link KeyboardEventInit} events
   * to the topic {@link RouterOutlets.keyboardEventTopic}.
   */
  private installKeyboardEventDispatcher(eventType: string, keystrokes: Set<string>): void {
    this._keyboardEvents$
      .pipe(
        filter(event => event.type === eventType),
        filter(event => keystrokes.has(Keystroke.fromEvent(event).parts)),
        takeUntil(merge(this._keystrokesChange$, this._destroy$)),
      )
      .subscribe((event: KeyboardEvent) => runSafe(() => {
        const eventInit: KeyboardEventInit = {
          key: event.key,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          bubbles: event.bubbles,
        };
        this._whenOutletIdentity.then(outletIdentity => {
          const publishTo = RouterOutlets.keyboardEventTopic(outletIdentity, event.type);
          Beans.get(MessageClient).publish<KeyboardEventInit>(publishTo, eventInit);
        });
      }));
  }

  /**
   * Looks up the identity of the outlet containing this microfrontend. If not running in the context of an outlet, the Promise returned never resolves.
   */
  private lookupOutletIdentity(): Promise<string> {
    return Beans.get(ContextService).observe$<OutletContext>(OUTLET_CONTEXT)
      .pipe(take(1), takeUntil(this._destroy$))
      .toPromise()
      .then(outletContext => outletContext ? Promise.resolve(outletContext.uid) : new Promise<never>(noop));
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}
