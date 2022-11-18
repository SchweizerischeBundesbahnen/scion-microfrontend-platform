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
import {auditTime, filter, takeUntil} from 'rxjs/operators';
import {MessageClient} from '../messaging/message-client';
import {UUID} from '@scion/toolkit/uuid';
import {mapToBody} from '../../messaging.model';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {ContextService} from '../context/context-service';
import {ACTIVATION_CONTEXT} from '../../platform.model';
import {FocusMonitor} from '../focus/focus-monitor';

/**
 * Dispatches 'mousemove' events originating from other documents as synthetic 'sci-mousemove' events on the document event bus.
 * The events are only dispatched if the user has pressed the primary mouse button.
 *
 * Mouse event dispatching is important if having non-focusable scrollbars which are positioned at the iframe border. It enables the user
 * to scroll seamlessly even when the mouse cursor leaves the iframe.
 *
 * @ignore
 */
export class MouseMoveEventDispatcher implements PreDestroy {

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

    this.publishMouseMoveEvent();
    this.receiveMouseMoveEvent();
  }

  /**
   * Publishes 'mousemove' events if the user has pressed the primary mouse button, but only if this document does not have the focus,
   * so that the active document can dispatch the events on its event bus.
   */
  private publishMouseMoveEvent(): void {
    Beans.get(FocusMonitor).focus$
      .pipe(
        switchMap(hasFocus => hasFocus ? EMPTY : fromEvent<MouseEvent>(document, 'mousemove')),
        filter(event => event.buttons === PRIMARY_MOUSE_BUTTON),
        auditTime(20),
        takeUntil(this._destroy$),
      )
      .subscribe((event: MouseEvent) => {
        const options = {headers: new Map().set(DISPATCHER_ID_HEADER, this._dispatcherId)};
        Beans.get(MessageClient).publish(MOUSEMOVE_EVENT_TOPIC, [event.screenX, event.screenY], options);
      });
  }

  /**
   * Receives 'mousemove' events from other documents, but only if this document has the focus, and dispatches them on the event bus.
   */
  private receiveMouseMoveEvent(): void {
    // Consume synth mouse events only if owning the focus.
    Beans.get(FocusMonitor).focus$
      .pipe(
        switchMap(hasFocus => hasFocus ? Beans.get(MessageClient).observe$<[number, number]>(MOUSEMOVE_EVENT_TOPIC) : EMPTY),
        filter(msg => msg.headers.get(DISPATCHER_ID_HEADER) !== this._dispatcherId),
        mapToBody(),
        takeUntil(this._destroy$),
      )
      .subscribe(([screenX, screenY]: [number, number]) => {
        const sciMouseEvent: any = new Event('sci-mousemove');
        sciMouseEvent.screenX = screenX;
        sciMouseEvent.screenY = screenY;
        document.dispatchEvent(sciMouseEvent);
      });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Indicates that the primary mouse button is pressed (usually left).
 *
 * @ignore
 */
const PRIMARY_MOUSE_BUTTON = 1;
/**
 * Message header to pass the dispatcher's identity.
 *
 * @ignore
 */
const DISPATCHER_ID_HEADER = 'ɵDISPATCHER_ID';
/**
 * Topic to publish 'mousemove' events so that they can be consumed by dispatchers of other documents.
 *
 * @ignore
 */
const MOUSEMOVE_EVENT_TOPIC = 'ɵMOUSEMOVE';
