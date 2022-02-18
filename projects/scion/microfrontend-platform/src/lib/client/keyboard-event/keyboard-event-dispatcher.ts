/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {fromEvent, merge, MonoTypeOperatorFunction, Observable, OperatorFunction, Subject, withLatestFrom} from 'rxjs';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {MessageClient} from '../messaging/message-client';
import {ContextService} from '../context/context-service';
import {KEYSTROKE_CONTEXT_NAME_PREFIX, OUTLET_CONTEXT, OutletContext, RouterOutlets} from '../router-outlet/router-outlet.element';
import {Keystroke, KeystrokeFlags} from './keystroke';
import {runSafe} from '../../safe-runner';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {filterArray, mapArray} from '@scion/toolkit/operators';

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
  private _keyboardEvents$ = new Subject<KeyboardEvent>();

  constructor() {
    this.installKeyboardEventListener();
    this.installKeystrokeListener();
  }

  /**
   * Subscribes to keyboard events on document-level and emits them on the {@link _keyboardEvents$} Observable.
   *
   * IMPORTANT NOTE FOR ANGULAR APPLICATIONS:
   * Always subscribe to top-level DOM events during event dispatcher construction. Event dispatchers are eagerly constructed on platform startup.
   * Typically, Angular applications connect to the platform outside of the Angular zone to avoid excessive change detection cycles for irrelevant DOM events.
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
      .pipe(
        map(contextNames => Array.from(contextNames)),
        filterArray(contextName => contextName.startsWith(KEYSTROKE_CONTEXT_NAME_PREFIX)),
        mapArray(keystrokeContextName => keystrokeContextName.substring(KEYSTROKE_CONTEXT_NAME_PREFIX.length)),
        mapArray(keystroke => this.observeKeyboardEvent$(keystroke)),
        switchMap(keyboardEvents => merge(...keyboardEvents)),
        withLatestFrom(Beans.get(ContextService).observe$<OutletContext>(OUTLET_CONTEXT).pipe(filter(Boolean))),
        takeUntil(this._destroy$),
      )
      .subscribe(([event, outletContext]) => runSafe(() => this.onKeyboardEventToPropagate(event, outletContext.uid)));
  }

  /**
   * Method invoked for each keyboard events to be propagated to the parent router outlet across the iframe boundary.
   */
  private onKeyboardEventToPropagate(event: KeyboardEvent, outletIdentity: string): void {
    const eventInit: KeyboardEventInit = {
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      bubbles: event.bubbles,
    };

    const publishTo = RouterOutlets.keyboardEventTopic(outletIdentity, event.type);
    Beans.get(MessageClient).publish<KeyboardEventInit>(publishTo, eventInit);
  }

  /**
   * Observes keyboard events matching the given keystroke, applying flags as declared on the keystroke.
   */
  private observeKeyboardEvent$(keystroke: string): Observable<KeyboardEvent> {
    return Beans.get(ContextService).observe$<KeystrokeFlags>(KEYSTROKE_CONTEXT_NAME_PREFIX + keystroke, {collect: true})
      .pipe(
        map(collectedFlags => Keystroke
          .fromString(keystroke)
          .withFlags(collectedFlags.reduceRight((acc, flags) => ({...acc, ...flags}), {} as KeystrokeFlags)),
        ),
        this.switchToKeyboardEvents(),
      );
  }

  private switchToKeyboardEvents(): OperatorFunction<Keystroke, KeyboardEvent> {
    return switchMap(keystroke => this._keyboardEvents$
      .pipe(
        filter(event => event.type === keystroke.eventType),
        filter(event => Keystroke.fromEvent(event).parts === keystroke.parts),
        applyKeystrokeFlags(keystroke.flags),
      ),
    );
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Applies keystroke flags on each keyboard event emitted by the source Observable.
 *
 * Note that `preventDefault()` has to be invoked on the original event, which has its `isTrusted` flag set to `true`.
 *
 * For more information about trusted events
 * @see https://www.w3.org/TR/DOM-Level-3-Events/#trusted-events
 * @see https://www.chromestatus.com/features#istrusted
 *
 * @internal
 */
function applyKeystrokeFlags(flags: KeystrokeFlags | undefined): MonoTypeOperatorFunction<KeyboardEvent> {
  return tap(keystrokeEvent => {
    if (flags?.preventDefault) {
      keystrokeEvent.preventDefault();
    }
  });
}
