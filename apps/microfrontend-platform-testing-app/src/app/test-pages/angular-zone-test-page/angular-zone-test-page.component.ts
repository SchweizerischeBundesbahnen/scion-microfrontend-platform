/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UUID} from '@scion/toolkit/uuid';
import {finalize, skip, take} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {ContextService, FocusMonitor, IntentClient, ManifestService, MessageClient, MessageHeaders, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';
import {SciAccordionModule} from '@scion/components.internal/accordion';
import {TestingAppTopics} from '../../testing-app.topics';

@Component({
  selector: 'app-angular-zone-test-page',
  templateUrl: './angular-zone-test-page.component.html',
  styleUrls: ['./angular-zone-test-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SciCheckboxModule,
    SciAccordionModule,
  ],
})
export class AngularZoneTestPageComponent {

  public tests = {
    messageClient: {
      observe$: {runInAngular: true, response: {zone: null, label: null}},
      request$: {runInAngular: true, response: {zone: null, label: null}},
      subscriberCount$: {runInAngular: true, response: {zone: null, label: null}},
    },
    intentClient: {
      observe$: {runInAngular: true, response: {zone: null, label: null}},
      request$: {runInAngular: true, response: {zone: null, label: null}},
    },
    contextService: {
      observe$: {runInAngular: true, response1: {zone: null, label: null}, response2: {zone: null, label: null}},
      names$: {runInAngular: true, response1: {zone: null, label: null}, response2: {zone: null, label: null}},
    },
    manifestService: {
      lookupCapabilities$: {runInAngular: true, response: {zone: null, label: null}},
      lookupIntentions$: {runInAngular: true, response: {zone: null, label: null}},
    },
    focusMonitor: {
      focusWithin$: {runInAngular: true, response: {zone: null, label: null}},
    },
  };

  constructor(private _zone: NgZone, private _cd: ChangeDetectorRef) {
  }

  public onMessageClientObserve(): void {
    this.tests.messageClient.observe$.response = null;
    this.runInZone(this.tests.messageClient.observe$.runInAngular, async (): Promise<void> => {
      const topic = UUID.randomUUID();

      // Observe messages.
      Beans.get(MessageClient).observe$(topic)
        .pipe(take(1))
        .subscribe(() => {
          this.tests.messageClient.observe$.response = createZoneAwareResponse({
            insideAngular: 'Received message INSIDE Angular zone',
            outsideAngular: 'Received message OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });

      // Publish retained message.
      await Beans.get(MessageClient).publish(topic, null, {retain: true});
    });
  }

  public onMessageClientRequest(): void {
    this.tests.messageClient.request$.response = null;
    this.runInZone(this.tests.messageClient.request$.runInAngular, async (): Promise<void> => {
      const topic = UUID.randomUUID();

      // Request data.
      Beans.get(MessageClient).request$(topic, undefined, {retain: true})
        .pipe(take(1))
        .subscribe(() => {
          this.tests.messageClient.request$.response = createZoneAwareResponse({
            insideAngular: 'Received response INSIDE Angular zone',
            outsideAngular: 'Received response OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });

      // Install replier.
      Beans.get(MessageClient).observe$(topic)
        .pipe((take(1)))
        .subscribe(request => {
          Beans.get(MessageClient).publish(request.headers.get(MessageHeaders.ReplyTo));
        });
    });
  }

  public onMessageClientSubscriberCount(): void {
    this.tests.messageClient.subscriberCount$.response = null;
    this.runInZone(this.tests.messageClient.subscriberCount$.runInAngular, async (): Promise<void> => {
      Beans.get(MessageClient).subscriberCount$(UUID.randomUUID())
        .pipe(take(1))
        .subscribe(() => {
          this.tests.messageClient.subscriberCount$.response = createZoneAwareResponse({
            insideAngular: 'Received response INSIDE Angular zone',
            outsideAngular: 'Received response OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  public onIntentClientObserve(): void {
    this.tests.intentClient.observe$.response = null;
    this.runInZone(this.tests.intentClient.observe$.runInAngular, async (): Promise<void> => {
      const type = UUID.randomUUID();

      // Register capability.
      await Beans.get(ManifestService).registerCapability({type});

      // Publish retained intent.
      await Beans.get(IntentClient).publish({type}, null, {retain: true});

      // Observe intents.
      Beans.get(IntentClient).observe$({type})
        .pipe(
          take(1),
          finalize(() => Beans.get(ManifestService).unregisterCapabilities({type})),
        )
        .subscribe(() => {
          this.tests.intentClient.observe$.response = createZoneAwareResponse({
            insideAngular: 'Received intent INSIDE Angular zone',
            outsideAngular: 'Received intent OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  public onIntentClientRequest(): void {
    this.tests.intentClient.request$.response = null;
    this.runInZone(this.tests.intentClient.request$.runInAngular, async (): Promise<void> => {
      const type = UUID.randomUUID();

      // Register capability.
      await Beans.get(ManifestService).registerCapability({type});

      // Send request.
      Beans.get(IntentClient).request$({type}, undefined, {retain: true})
        .pipe(
          take(1),
          finalize(() => Beans.get(ManifestService).unregisterCapabilities({type})),
        )
        .subscribe(() => {
          this.tests.intentClient.request$.response = createZoneAwareResponse({
            insideAngular: 'Received response INSIDE Angular zone',
            outsideAngular: 'Received response OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });

      // Install replier.
      await Beans.get(IntentClient).observe$({type})
        .pipe((take(1)))
        .subscribe(request => {
          Beans.get(MessageClient).publish(request.headers.get(MessageHeaders.ReplyTo));
        });
    });
  }

  public onContextServiceObserve(): void {
    this.tests.contextService.observe$.response1 = null;
    this.tests.contextService.observe$.response2 = null;
    this.runInZone(this.tests.contextService.observe$.runInAngular, async (): Promise<void> => {
      const contextKey = UUID.randomUUID();
      const outletContext = await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT);

      // Observbe context value.
      Beans.get(ContextService).observe$(contextKey)
        .pipe(take(1))
        .subscribe(() => {
          this.tests.contextService.observe$.response1 = createZoneAwareResponse({
            insideAngular: 'Received context value INSIDE Angular zone (1st emission)',
            outsideAngular: 'Received context value OUTSIDE Angular zone (1st emission)',
          });
          this.detectChangesIfOutsideAngular();

          // Trigger context value update.
          Beans.get(MessageClient).publish(TestingAppTopics.routerOutletContextUpdateTopic(outletContext.name, contextKey), `value-${UUID.randomUUID()}`);
        });

      // Receive context value updates.
      Beans.get(ContextService).observe$(contextKey)
        .pipe(skip(1), take(1))
        .subscribe(() => {
          this.tests.contextService.observe$.response2 = createZoneAwareResponse({
            insideAngular: 'Received context value INSIDE Angular zone (2nd emission)',
            outsideAngular: 'Received value OUTSIDE Angular zone (2nd emission)',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  public onContextServiceNames(): void {
    this.tests.contextService.names$.response1 = null;
    this.tests.contextService.names$.response2 = null;
    this.runInZone(this.tests.contextService.names$.runInAngular, async (): Promise<void> => {
      const outletContext = await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT);

      // Observe context names.
      Beans.get(ContextService).names$()
        .pipe(take(1))
        .subscribe(() => {
          this.tests.contextService.names$.response1 = createZoneAwareResponse({
            insideAngular: 'Received context names INSIDE Angular zone (1st emission)',
            outsideAngular: 'Received context names OUTSIDE Angular zone (1st emission)',
          });
          this.detectChangesIfOutsideAngular();

          // Trigger context value update.
          Beans.get(MessageClient).publish(TestingAppTopics.routerOutletContextUpdateTopic(outletContext.name, UUID.randomUUID()), `value-${UUID.randomUUID()}`);
        });

      // Receive context name updates.
      Beans.get(ContextService).names$()
        .pipe(skip(1), take(1))
        .subscribe(() => {
          this.tests.contextService.names$.response2 = createZoneAwareResponse({
            insideAngular: 'Received context names INSIDE Angular zone (2nd emission)',
            outsideAngular: 'Received names OUTSIDE Angular zone (2nd emission)',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  public onManifestServiceLookupCapabilities(): void {
    this.tests.manifestService.lookupCapabilities$.response = null;
    this.runInZone(this.tests.manifestService.lookupCapabilities$.runInAngular, async (): Promise<void> => {
      Beans.get(ManifestService).lookupCapabilities$()
        .pipe(take(1))
        .subscribe(() => {
          this.tests.manifestService.lookupCapabilities$.response = createZoneAwareResponse({
            insideAngular: 'Received response INSIDE Angular zone',
            outsideAngular: 'Received response OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  public onManifestServiceLookupIntentions(): void {
    this.tests.manifestService.lookupIntentions$.response = null;
    this.runInZone(this.tests.manifestService.lookupIntentions$.runInAngular, async (): Promise<void> => {
      Beans.get(ManifestService).lookupIntentions$()
        .pipe(take(1))
        .subscribe(() => {
          this.tests.manifestService.lookupIntentions$.response = createZoneAwareResponse({
            insideAngular: 'Received response INSIDE Angular zone',
            outsideAngular: 'Received response OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  public onFocusMonitorFocusWithin(): void {
    this.tests.focusMonitor.focusWithin$.response = null;
    this.runInZone(this.tests.focusMonitor.focusWithin$.runInAngular, async (): Promise<void> => {
      Beans.get(FocusMonitor).focusWithin$
        .pipe(take(1))
        .subscribe(() => {
          this.tests.focusMonitor.focusWithin$.response = createZoneAwareResponse({
            insideAngular: 'Received response INSIDE Angular zone',
            outsideAngular: 'Received response OUTSIDE Angular zone',
          });
          this.detectChangesIfOutsideAngular();
        });
    });
  }

  /**
   * Runs given callback inside or outside Angular.
   */
  private runInZone(runInAngular: boolean, fn: () => void): void {
    runInAngular ? this._zone.run(fn) : this._zone.runOutsideAngular(fn);
  }

  private detectChangesIfOutsideAngular(): void {
    if (!NgZone.isInAngularZone()) {
      this._cd.detectChanges();
    }
  }
}

function createZoneAwareResponse(messages: {insideAngular: string; outsideAngular: string}): {zone: string; label: string} {
  return {
    zone: NgZone.isInAngularZone() ? 'inside-angular' : 'outside-angular',
    label: NgZone.isInAngularZone() ? messages.insideAngular : messages.outsideAngular,
  };
}
