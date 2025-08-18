/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {EMPTY, fromEvent, race, Subject, switchMap} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MessageClient} from '../messaging/message-client';
import {PlatformTopics} from '../../ɵmessaging.model';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {FocusMonitor} from './focus-monitor';
import {OUTLET_CONTEXT, OutletContext, RouterOutlets} from '../router-outlet/router-outlet.element';
import {ContextService} from '../context/context-service';
import {ACTIVATION_CONTEXT} from '../../platform.model';

/**
 * Sends a 'focusin' event to the topic {@link PlatformTopics.FocusIn} when this document gains focus.
 *
 * @see FocusTracker
 * @internal
 */
export class FocusInEventDispatcher implements PreDestroy {

  private _destroy$ = new Subject<void>();

  constructor() {
    // IMPORTANT: For Angular applications, the platform is started outside the Angular zone. To avoid excessive change detection cycles,
    // this dispatcher is eagerly set up at platform startup and installed only for regular microfrontends, not activator microfrontends.
    void this.installFocusEventDispatcher();
  }

  /**
   * Installs focus event dispatching, but only if not loaded as activator.
   */
  private async installFocusEventDispatcher(): Promise<void> {
    if (await Beans.get(ContextService).isPresent(ACTIVATION_CONTEXT)) {
      return;
    }

    this.publishFocusInEvent();
    await this.notifyOutletAboutFocusChange();
  }

  /**
   * Publishes 'focusin' events for the platform to track focus ownership.
   */
  private publishFocusInEvent(): void {
    Beans.get(FocusMonitor).focus$
      .pipe(
        switchMap(hasFocus => hasFocus ? EMPTY : race(
          fromEvent(window, 'focusin', {once: true}), // when gaining focus, e.g., via click on focusable element or sequential keyboard navigation
          fromEvent(window, 'mousedown', {once: true, capture: true}), // required if "focusin" is not triggered, e.g., if element is not focusable or prevent default was invoked on the mousedown event
        )),
        takeUntil(this._destroy$),
      )
      .subscribe(() => void Beans.get(MessageClient).publish<void>(PlatformTopics.FocusIn));
  }

  /**
   * Reports the embedding outlet when the current microfrontend or any of its child microfrontends has gained or lost focus.
   * It does not report while the focus remains within this microfrontend or any of its child microfrontends.
   */
  private async notifyOutletAboutFocusChange(): Promise<void> {
    const outletContext = await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT);
    if (!outletContext) {
      return;
    }

    Beans.get(FocusMonitor).focusWithin$
      .pipe(takeUntil(this._destroy$))
      .subscribe(focusWithin => {
        const publishTo = RouterOutlets.focusWithinOutletTopic(outletContext.uid);
        void Beans.get(MessageClient).publish<boolean>(publishTo, focusWithin);
      });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}
