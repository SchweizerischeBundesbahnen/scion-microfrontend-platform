/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EMPTY, fromEvent, Subject, switchMap} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {MessageClient} from '../messaging/message-client';
import {UUID} from '@scion/toolkit/uuid';
import {mapToBody} from '../../messaging.model';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {ACTIVATION_CONTEXT} from '../../platform.model';
import {FocusMonitor} from '../focus/focus-monitor';
import {ContextService} from '../context/context-service';

/**
 * Dispatches 'mouseup' events originating from other documents as synthetic 'sci-mouseup' events on the document event bus.
 *
 * Mouse event dispatching is important if having non-focusable scrollbars which are positioned at the iframe border. It enables the user
 * to scroll seamlessly even when the mouse cursor leaves the iframe.
 *
 * @ignore
 */
export class MouseUpEventDispatcher implements PreDestroy {

  private _destroy$ = new Subject<void>();
  private _dispatcherId = UUID.randomUUID();

  constructor() {
    // IMPORTANT: For Angular applications, the platform is started outside the Angular zone. To avoid excessive change detection cycles,
    // this dispatcher is eagerly set up at platform startup and installed only for regular microfrontends, not activator microfrontends.
    this.installMouseEventDispatcher().then();
  }

  /**
   * Installs mouse event dispatching, but only if not loaded as activator.
   */
  private async installMouseEventDispatcher(): Promise<void> {
    if (await Beans.get(ContextService).isPresent(ACTIVATION_CONTEXT)) {
      return;
    }

    this.publishMouseUpEvent();
    this.receiveMouseMoveEvent();
  }

  /**
   * Publishes 'mouseup' events, but only if this document does not have the focus, so that the active document can dispatch the events on its event bus.
   */
  private publishMouseUpEvent(): void {
    Beans.get(FocusMonitor).focus$
      .pipe(
        switchMap(hasFocus => hasFocus ? EMPTY : fromEvent(window, 'mouseup', {capture: true})),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        const options = {headers: new Map().set(DISPATCHER_ID_HEADER, this._dispatcherId)};
        Beans.get(MessageClient).publish(MOUSEUP_EVENT_TOPIC, undefined, options);
      });
  }

  /**
   * Receives 'mouseup' events from other documents, but only if this document has the focus, and dispatches them on the event bus.
   */
  private receiveMouseMoveEvent(): void {
    Beans.get(FocusMonitor).focus$
      .pipe(
        switchMap(hasFocus => hasFocus ? Beans.get(MessageClient).observe$<void>(MOUSEUP_EVENT_TOPIC) : EMPTY),
        filter(msg => msg.headers.get(DISPATCHER_ID_HEADER) !== this._dispatcherId),
        mapToBody(),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        document.dispatchEvent(new Event('sci-mouseup'));
      });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Message header to pass the dispatcher's identity.
 *
 * @ignore
 */
const DISPATCHER_ID_HEADER = 'ɵDISPATCHER_ID';
/**
 * Topic to publish 'mouseup' events so that they can be consumed by dispatchers of other documents.
 *
 * @ignore
 */
const MOUSEUP_EVENT_TOPIC = 'ɵMOUSEUP';
