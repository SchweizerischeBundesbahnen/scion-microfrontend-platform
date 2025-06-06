/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, HostListener, NgZone, OnDestroy} from '@angular/core';
import {ContextService, MicrofrontendPlatform, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {fromEvent, merge, withLatestFrom} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {RouterOutlet} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet],
})
export class AppComponent implements OnDestroy {

  private _outletContext: Promise<OutletContext | null>;

  constructor(private _zone: NgZone) {
    this._outletContext = Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT);
    this.installPropagatedKeyboardEventLogger();
  }

  // TODO [Angular 21] Remove if cast is not required anymore.
  @HostListener('document:keydown.control.alt.shift.s', ['$event'])
  public async onE2eTestKeyboardEvent(event: Event): Promise<void> {
    const keyboardEvent = event as KeyboardEvent;
    // only log "real", aka trusted events and ignore synthetic events, e.g. keyboard events propagated across iframe boundaries.
    if (keyboardEvent.isTrusted) {
      const outletContextName = (await this._outletContext)?.name ?? 'n/a';
      console.debug(`[AppComponent::document:onkeydown] [TRUSTED] [outletContext=${outletContextName}, key='${keyboardEvent.key}', control=${keyboardEvent.ctrlKey}, shift=${keyboardEvent.shiftKey}, alt=${keyboardEvent.altKey}, meta=${keyboardEvent.metaKey}, defaultPrevented=${keyboardEvent.defaultPrevented}]`);
    }
  }

  /**
   * Logs propagated keyboard events, i.e., keyboard events propagated across iframe boundaries.
   *
   * Do not install via {@link HostListener} to not trigger change detection for each keyboard event.
   */
  private installPropagatedKeyboardEventLogger(): void {
    merge(fromEvent<KeyboardEvent>(document, 'keydown'), fromEvent<KeyboardEvent>(document, 'keyup'))
      .pipe(
        withLatestFrom(this._outletContext),
        subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        takeUntilDestroyed(),
      )
      .subscribe(([event, outletContext]: [KeyboardEvent, OutletContext | null]) => {
        if (!event.isTrusted && (event.target as Element).tagName === 'SCI-ROUTER-OUTLET') {
          console.debug(`[AppComponent::document:on${event.type}] [SYNTHETIC] [outletContext=${outletContext?.name ?? 'n/a'}, key='${event.key}', control=${event.ctrlKey}, shift=${event.shiftKey}, alt=${event.altKey}, meta=${event.metaKey}]`);
        }
      });
  }

  public ngOnDestroy(): void {
    MicrofrontendPlatform.destroy().then(); // Platform is started in {@link PlatformInitializer}
  }
}
