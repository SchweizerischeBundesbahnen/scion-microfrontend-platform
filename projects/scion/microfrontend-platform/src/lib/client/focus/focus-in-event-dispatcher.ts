/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {fromEvent, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MessageClient} from '../messaging/message-client';
import {PlatformTopics} from '../../ɵmessaging.model';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {FocusMonitor} from './focus-monitor';
import {OUTLET_CONTEXT, OutletContext, RouterOutlets} from '../router-outlet/router-outlet.element';
import {ContextService} from '../context/context-service';

/**
 * Sends a 'focusin' event to the topic {@link PlatformTopics.FocusIn} when this document gains focus.
 *
 * @see FocusTracker
 * @ignore
 */
export class FocusInEventDispatcher implements PreDestroy {

  private _destroy$ = new Subject<void>();

  constructor() {
    // IMPORTANT: In Angular applications, the platform should be started outside of the Angular zone in order to avoid excessive change detection cycles
    // of platform-internal subscriptions to global DOM events. For that reason, we subscribe to `window.focus` events in the dispatcher's constructor.
    this.makeWindowFocusable();
    this.dispatchDocumentFocusInEvent();
    this.reportFocusWithinEventToParentOutlet();
  }

  /**
   * Installs a listener for `focusin` events.
   */
  private dispatchDocumentFocusInEvent(): void {
    fromEvent<FocusEvent>(window, 'focusin')
      .pipe(takeUntil(this._destroy$))
      .subscribe(event => {
        // Do not dispatch the event if the focusing occurs within this document.
        // In this case, the related target is set, unless the focus owner is disposed.
        if (!event.relatedTarget) {
          Beans.get(MessageClient).publish(PlatformTopics.FocusIn, null, {retain: true}); // do not set `undefined` as payload as this would delete the retained message
        }
      });
  }

  /**
   * Reports the embedding outlet when the current microfrontend or any of its child microfrontends has gained or lost focus.
   * It does not report while the focus remains within this microfrontend or any of its child microfrontends.
   */
  private async reportFocusWithinEventToParentOutlet(): Promise<void> {
    const outletContext = await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT);
    if (!outletContext) {
      return;
    }

    Beans.get(FocusMonitor).focusWithin$
      .pipe(takeUntil(this._destroy$))
      .subscribe(focusWithin => {
        const publishTo = RouterOutlets.focusWithinOutletTopic(outletContext.uid);
        Beans.get(MessageClient).publish<boolean>(publishTo, focusWithin);
      });
  }

  /**
   * Makes this Window focusable in order to receive 'focusin' events.
   */
  private makeWindowFocusable(): void {
    const body = window.document.body;
    body.setAttribute('tabindex', '0');
    body.style.outline = 'none';
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}
