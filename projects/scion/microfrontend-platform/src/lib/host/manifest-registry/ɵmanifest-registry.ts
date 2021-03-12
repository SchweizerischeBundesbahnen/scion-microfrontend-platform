/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Capability, Intention } from '../../platform.model';
import { sha256 } from 'js-sha256';
import { Defined } from '@scion/toolkit/util';
import { ManifestObjectFilter, ManifestObjectStore } from './manifest-object-store';
import { defer, merge, of, Subject } from 'rxjs';
import { distinctUntilChanged, expand, mergeMapTo, take, takeUntil } from 'rxjs/operators';
import { PlatformMessageClient } from '../platform-message-client';
import { Intent, MessageHeaders, ResponseStatusCodes, TopicMessage } from '../../messaging.model';
import { takeUntilUnsubscribe } from '../../client/messaging/message-client';
import { ApplicationRegistry } from '../application-registry';
import { runSafe } from '../../safe-runner';
import { filterArray } from '@scion/toolkit/operators';
import { ManifestRegistry } from './manifest-registry';
import { assertExactQualifier, QualifierMatcher } from '../../qualifier-matcher';
import { Beans, PreDestroy } from '@scion/toolkit/bean-manager';
import { stringifyError } from '../../error.util';

export class ɵManifestRegistry implements ManifestRegistry, PreDestroy { // tslint:disable-line:class-name

  private _capabilityStore: ManifestObjectStore<Capability>;
  private _intentionStore: ManifestObjectStore<Intention>;
  private _destroy$ = new Subject<void>();

  constructor() {
    this._capabilityStore = new ManifestObjectStore<Capability>();
    this._intentionStore = new ManifestObjectStore<Intention>();

    this.installCapabilityRegisterRequestHandler();
    this.installCapabilityUnregisterRequestHandler();

    this.installIntentionRegisterRequestHandler();
    this.installIntentionUnregisterRequestHandler();

    this.installCapabilitiesLookupRequestHandler();
    this.installIntentionsLookupRequestHandler();
  }

  /**
   * @inheritDoc
   */
  public resolveCapabilitiesByIntent(intent: Intent, appSymbolicName: string): Capability[] {
    assertExactQualifier(intent.qualifier);
    const filter: ManifestObjectFilter = {type: intent.type, qualifier: intent.qualifier || {}};
    return this._capabilityStore.find(filter, capabilityQualifier => new QualifierMatcher(capabilityQualifier, {evalAsterisk: true, evalOptional: true}).matches(intent.qualifier))
      .filter(capability => this.isCapabilityVisibleToMicroApplication(capability, appSymbolicName));
  }

  /**
   * @inheritDoc
   */
  public hasIntention(intent: Intent, appSymbolicName: string): boolean {
    assertExactQualifier(intent.qualifier);
    const filter: ManifestObjectFilter = {appSymbolicName, type: intent.type, qualifier: intent.qualifier || {}};
    return (
      Beans.get(ApplicationRegistry).isIntentionCheckDisabled(appSymbolicName) ||
      this._intentionStore.find(filter, intentionQualifier => new QualifierMatcher(intentionQualifier, {evalAsterisk: true, evalOptional: true}).matches(intent.qualifier)).length > 0 ||
      this._capabilityStore.find(filter, capabilityQualifier => new QualifierMatcher(capabilityQualifier, {evalAsterisk: true, evalOptional: true}).matches(intent.qualifier)).length > 0
    );
  }

  /**
   * Tests whether the given app has declared a satisfying intention for the given capability, or whether the app provides the capability itself,
   * or 'intention check' is disabled for the app.
   */
  private hasIntentionForCapability(appSymbolicName: string, capability: Capability): boolean {
    if (Beans.get(ApplicationRegistry).isIntentionCheckDisabled(appSymbolicName)) {
      return true;
    }

    if (capability.metadata.appSymbolicName === appSymbolicName) {
      return true;
    }

    const filter: ManifestObjectFilter = {appSymbolicName, type: capability.type, qualifier: capability.qualifier};
    return this._intentionStore.find(filter, intentionQualifier => new QualifierMatcher(intentionQualifier, {evalAsterisk: true, evalOptional: true}).matches(capability.qualifier)).length > 0;
  }

  /**
   * Tests whether the given micro app can see the given capability, i.e. the app provides the capability itself, or the capability has public visibility,
   * or 'scope check' is disabled for the requesting micro app.
   */
  private isCapabilityVisibleToMicroApplication(capability: Capability, appSymbolicName: string): boolean {
    return (
      Beans.get(ApplicationRegistry).isScopeCheckDisabled(appSymbolicName) ||
      !capability.private ||
      capability.metadata.appSymbolicName === appSymbolicName
    );
  }

  public registerCapability(capability: Capability, appSymbolicName: string): string | undefined {
    if (!capability) {
      throw Error('[CapabilityRegisterError] Missing required capability.');
    }
    if (capability.qualifier && capability.qualifier.hasOwnProperty('*')) {
      throw Error('[CapabilityRegisterError] Asterisk wildcard (\'*\') not allowed in the qualifier key.');
    }

    const registeredCapability: Capability = {
      ...capability,
      qualifier: Defined.orElse(capability.qualifier, {}),
      requiredParams: Defined.orElse(capability.requiredParams, []),
      optionalParams: Defined.orElse(capability.optionalParams, []),
      private: Defined.orElse(capability.private, true),
      metadata: {
        id: sha256(JSON.stringify({application: appSymbolicName, type: capability.type, ...capability.qualifier})).substr(0, 7), // use the first 7 digits of the capability hash as capability id
        appSymbolicName: appSymbolicName,
      },
    };

    // Register the capability.
    this._capabilityStore.add(registeredCapability);

    return registeredCapability.metadata.id;
  }

  private unregisterCapabilities(appSymbolicName: string, filter: ManifestObjectFilter): void {
    this._capabilityStore.remove({...filter, appSymbolicName});
  }

  public registerIntention(intention: Intention, appSymbolicName: string): string | undefined {
    if (!intention) {
      throw Error(`[IntentionRegisterError] Missing required intention.`);
    }

    const registeredIntention: Intention = {
      ...intention,
      metadata: {
        id: sha256(JSON.stringify({application: appSymbolicName, type: intention.type, ...intention.qualifier})).substr(0, 7), // use the first 7 digits of the intent hash as intent id
        appSymbolicName: appSymbolicName,
      },
    };

    this._intentionStore.add(registeredIntention);
    return registeredIntention.metadata.id;
  }

  private unregisterIntention(appSymbolicName: string, filter: ManifestObjectFilter): void {
    this._intentionStore.remove({...filter, appSymbolicName});
  }

  private installCapabilityRegisterRequestHandler(): void {
    Beans.get(PlatformMessageClient).observe$(ManifestRegistryTopics.RegisterCapability)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<Capability>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const capability = request.body;
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          const capabilityId = this.registerCapability(capability, appSymbolicName);
          Beans.get(PlatformMessageClient).publish(replyTo, capabilityId, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(PlatformMessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installCapabilityUnregisterRequestHandler(): void {
    Beans.get(PlatformMessageClient).observe$(ManifestRegistryTopics.UnregisterCapabilities)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const capabilityFilter = request.body || {};
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          this.unregisterCapabilities(appSymbolicName, capabilityFilter);
          Beans.get(PlatformMessageClient).publish(replyTo, undefined, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(PlatformMessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installIntentionRegisterRequestHandler(): void {
    Beans.get(PlatformMessageClient).observe$(ManifestRegistryTopics.RegisterIntention)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<Intention>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const intent = request.body;
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          assertIntentionRegisterApiEnabled(appSymbolicName);
          const intentionId = this.registerIntention(intent, appSymbolicName);
          Beans.get(PlatformMessageClient).publish(replyTo, intentionId, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(PlatformMessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installIntentionUnregisterRequestHandler(): void {
    Beans.get(PlatformMessageClient).observe$(ManifestRegistryTopics.UnregisterIntentions)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const intentFilter = request.body || {};
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          assertIntentionRegisterApiEnabled(appSymbolicName);
          this.unregisterIntention(appSymbolicName, intentFilter);
          Beans.get(PlatformMessageClient).publish(replyTo, undefined, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(PlatformMessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installCapabilitiesLookupRequestHandler(): void {
    Beans.get(PlatformMessageClient).observe$(ManifestRegistryTopics.LookupCapabilities)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);
        const lookupFilter = request.body || {};

        // The queried capabilities may change on both, capability or intention change, because the computation
        // of visible and qualified capabilities depends on registered capabilities and manifested intentions.
        const registryChange$ = merge(this._capabilityStore.change$, this._intentionStore.change$);
        const finder$ = defer(() => of(this._capabilityStore.find(lookupFilter)));
        return finder$
          .pipe(
            expand(() => registryChange$.pipe(take(1), mergeMapTo(finder$))),
            filterArray(capability => this.isCapabilityVisibleToMicroApplication(capability, appSymbolicName)),
            filterArray(capability => this.hasIntentionForCapability(appSymbolicName, capability)),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            takeUntilUnsubscribe(replyTo, PlatformMessageClient),
          )
          .subscribe(capabilities => { // tslint:disable-line:rxjs-no-nested-subscribe
            Beans.get(PlatformMessageClient).publish<Capability[]>(replyTo, capabilities, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
          });
      }));
  }

  private installIntentionsLookupRequestHandler(): void {
    Beans.get(PlatformMessageClient).observe$(ManifestRegistryTopics.LookupIntentions)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const lookupFilter = request.body || {};

        const finder$ = defer(() => of(this._intentionStore.find(lookupFilter)));
        return finder$
          .pipe(
            expand(() => this._intentionStore.change$.pipe(take(1), mergeMapTo(finder$))),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            takeUntilUnsubscribe(replyTo, PlatformMessageClient),
          )
          .subscribe(intentions => { // tslint:disable-line:rxjs-no-nested-subscribe
            Beans.get(PlatformMessageClient).publish<Intention[]>(replyTo, intentions, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
          });
      }));
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Defines the topics to interact with the manifest registry from {@link ManifestService}.
 */
export enum ManifestRegistryTopics {
  LookupCapabilities = 'ɵLOOKUP_CAPABILITIES',
  LookupIntentions = 'ɵLOOKUP_INTENTIONS',
  RegisterCapability = 'ɵREGISTER_CAPABILITY',
  UnregisterCapabilities = 'ɵUNREGISTER_CAPABILITIES',
  RegisterIntention = 'ɵREGISTER_INTENTION',
  UnregisterIntentions = 'ɵUNREGISTER_INTENTIONS',
}

/**
 * Checks if the 'Intention Registration API' is enabled for the given app. If not, an error is thrown.
 */
function assertIntentionRegisterApiEnabled(appSymbolicName: string): void {
  if (Beans.get(ApplicationRegistry).isIntentionRegisterApiDisabled(appSymbolicName)) {
    throw Error(`[IntentionRegisterError] The 'Intention Registration API' is disabled for the application '${appSymbolicName}'. Contact the platform administrator to enable this API.`);
  }
}
