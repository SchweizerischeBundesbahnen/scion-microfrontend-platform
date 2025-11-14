/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, inject, NgZone} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UUID} from '@scion/toolkit/uuid';
import {finalize, take} from 'rxjs/operators';
import {Beans} from '@scion/toolkit/bean-manager';
import {ContextService, FocusMonitor, IntentClient, ManifestService, MessageClient, MessageHeaders, OUTLET_CONTEXT, OutletContext} from '@scion/microfrontend-platform';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {TestingAppTopics} from '../../testing-app.topics';
import {SciAccordionComponent, SciAccordionItemDirective} from '@scion/components.internal/accordion';

@Component({
  selector: 'app-angular-zone-test-page',
  templateUrl: './angular-zone-test-page.component.html',
  styleUrls: ['./angular-zone-test-page.component.scss'],
  imports: [
    NgTemplateOutlet,
    FormsModule,
    SciCheckboxComponent,
    SciAccordionComponent,
    SciAccordionItemDirective,
  ],
})
export default class AngularZoneTestPageComponent {

  public tests = {
    messageClient: {
      observe: new TestCaseModel(model => void this.testMessageClientObserve(model)),
      request: new TestCaseModel(model => this.testMessageClientRequest(model)),
      subscriberCount: new TestCaseModel(model => this.testMessageClientSubscriberCount(model)),
    },
    intentClient: {
      observe: new TestCaseModel(model => void this.testIntentClientObserve(model)),
      request: new TestCaseModel(model => void this.testIntentClientRequest(model)),
    },
    contextService: {
      observe: new TestCaseModel(model => void this.testContextServiceObserve(model)),
      names: new TestCaseModel(model => void this.testContextServiceNames(model)),
    },
    manifestService: {
      lookupCapabilities: new TestCaseModel(model => this.testManifestServiceLookupCapabilities(model)),
      lookupIntentions: new TestCaseModel(model => this.testManifestServiceLookupIntentions(model)),
    },
    focusMonitor: {
      focusWithin: new TestCaseModel(model => this.testFocusMonitorFocusWithin(model)),
      focus: new TestCaseModel(model => this.testFocusMonitorFocus(model)),
    },
  };

  private async testMessageClientObserve(model: TestCaseModel): Promise<void> {
    const topic = UUID.randomUUID();

    // Observe messages.
    Beans.get(MessageClient).observe$(topic)
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received message'));

    // Publish retained message.
    await Beans.get(MessageClient).publish(topic, null, {retain: true});
  }

  private testMessageClientRequest(model: TestCaseModel): void {
    const topic = UUID.randomUUID();

    // Request data.
    Beans.get(MessageClient).request$(topic, undefined, {retain: true})
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received response'));

    // Install replier.
    Beans.get(MessageClient).observe$(topic)
      .pipe((take(1)))
      .subscribe(request => {
        void Beans.get(MessageClient).publish(request.headers.get(MessageHeaders.ReplyTo) as string);
      });
  }

  private testMessageClientSubscriberCount(model: TestCaseModel): void {
    Beans.get(MessageClient).subscriberCount$(UUID.randomUUID())
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received subscriber count'));
  }

  private async testIntentClientObserve(model: TestCaseModel): Promise<void> {
    const type = UUID.randomUUID();

    // Register capability.
    await Beans.get(ManifestService).registerCapability({type});

    // Publish retained intent.
    await Beans.get(IntentClient).publish({type}, null, {retain: true});

    // Observe intents.
    Beans.get(IntentClient).observe$({type})
      .pipe(
        take(1),
        finalize(() => void Beans.get(ManifestService).unregisterCapabilities({type})),
      )
      .subscribe(() => model.addEmission('Received intent'));
  }

  private async testIntentClientRequest(model: TestCaseModel): Promise<void> {
    const type = UUID.randomUUID();

    // Register capability.
    await Beans.get(ManifestService).registerCapability({type});

    // Send request.
    Beans.get(IntentClient).request$({type}, undefined, {retain: true})
      .pipe(
        take(1),
        finalize(() => void Beans.get(ManifestService).unregisterCapabilities({type})),
      )
      .subscribe(() => model.addEmission('Received response'));

    // Install replier.
    Beans.get(IntentClient).observe$({type})
      .pipe((take(1)))
      .subscribe(request => {
        void Beans.get(MessageClient).publish(request.headers.get(MessageHeaders.ReplyTo) as string);
      });
  }

  private async testContextServiceObserve(model: TestCaseModel): Promise<void> {
    const contextKey = UUID.randomUUID();
    const outletContext = (await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT))!;

    // Observbe context value.
    Beans.get(ContextService).observe$(contextKey)
      .pipe(take(2))
      .subscribe(() => {
        model.addEmission('Received context value');

        // Trigger context value update.
        void Beans.get(MessageClient).publish(TestingAppTopics.routerOutletContextUpdateTopic(outletContext.name, contextKey), `value-${UUID.randomUUID()}`);
      });
  }

  private async testContextServiceNames(model: TestCaseModel): Promise<void> {
    const outletContext = (await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT))!;

    // Observe context names.
    Beans.get(ContextService).names$()
      .pipe(take(2))
      .subscribe(() => {
        model.addEmission('Received context names');

        // Trigger context value update.
        void Beans.get(MessageClient).publish(TestingAppTopics.routerOutletContextUpdateTopic(outletContext.name, UUID.randomUUID()), `value-${UUID.randomUUID()}`);
      });
  }

  private testManifestServiceLookupCapabilities(model: TestCaseModel): void {
    Beans.get(ManifestService).lookupCapabilities$()
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received capabilities'));
  }

  private testManifestServiceLookupIntentions(model: TestCaseModel): void {
    Beans.get(ManifestService).lookupIntentions$()
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received intentions'));
  }

  private testFocusMonitorFocusWithin(model: TestCaseModel): void {
    Beans.get(FocusMonitor).focusWithin$
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received focus state'));
  }

  private testFocusMonitorFocus(model: TestCaseModel): void {
    Beans.get(FocusMonitor).focus$
      .pipe(take(1))
      .subscribe(() => model.addEmission('Received focus state'));
  }
}

/**
 * Model of a single test case.
 */
export class TestCaseModel {

  public runInAngular = true;
  public emissions = new Array<{insideAngular: boolean; label: string}>();
  private _zone = inject(NgZone);

  constructor(private _testFn: (model: TestCaseModel) => void) {
  }

  /**
   * Invoke to register received emission.
   */
  public addEmission(emission: string): void {
    if (NgZone.isInAngularZone()) {
      this.emissions.push({insideAngular: true, label: `${emission} (INSIDE NgZone)`});
    }
    else {
      this._zone.run(() => this.emissions.push({insideAngular: false, label: `${emission} (OUTSIDE NgZone)`}));
    }
  }

  /**
   * Invoke from the template to run this test.
   */
  public onTestClick(): void {
    this.emissions.length = 0;
    if (this.runInAngular) {
      this._zone.run(() => this._testFn(this));
    }
    else {
      this._zone.runOutsideAngular(() => this._testFn(this));
    }
  }
}
