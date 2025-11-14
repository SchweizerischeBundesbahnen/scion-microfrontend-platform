/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationQualifiedForCapabilityRequest, Capability, Intention, ManifestObjectFilter, ParamDefinition} from '../../platform.model';
import {ManifestObjectStore} from './manifest-object-store';
import {concatWith, defer, EMPTY, filter, merge, Observable, of, Subscription} from 'rxjs';
import {distinctUntilChanged, expand, map, mergeMap, startWith, take} from 'rxjs/operators';
import {Intent, MessageHeaders, TopicMessage} from '../../messaging.model';
import {MessageClient} from '../../client/messaging/message-client';
import {ApplicationRegistry} from '../application-registry';
import {filterArray} from '@scion/toolkit/operators';
import {ManifestRegistry} from './manifest-registry';
import {QualifierMatcher} from '../../qualifier-matcher';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {ClientRegistry} from '../client-registry/client.registry';
import {CapabilityInterceptor} from './capability-interceptors';
import {UUID} from '@scion/toolkit/uuid';
import {Qualifiers} from '../../qualifiers.util';
import {PlatformTopics} from '../../ɵmessaging.model';

/**
 * @internal
 */
export class ɵManifestRegistry implements ManifestRegistry, PreDestroy {

  private _capabilityStore: ManifestObjectStore<Capability>;
  private _intentionStore: ManifestObjectStore<Intention>;
  private _subscriptions = new Set<Subscription>();

  public capabilityRegister$: Observable<Capability>;
  public capabilityUnregister$: Observable<Capability[]>;

  constructor() {
    this._capabilityStore = new ManifestObjectStore<Capability>();
    this._intentionStore = new ManifestObjectStore<Intention>();

    this.capabilityRegister$ = this._capabilityStore.add$;
    this.capabilityUnregister$ = this._capabilityStore.remove$;

    this.installCapabilityRegisterRequestHandler();
    this.installCapabilityUnregisterRequestHandler();

    this.installIntentionRegisterRequestHandler();
    this.installIntentionUnregisterRequestHandler();

    this.installCapabilitiesLookupRequestHandler();
    this.installIntentionsLookupRequestHandler();
    this.installIsApplicationQualifiedRequestHandler();
    this.installVersionLookupHandler();
  }

  /**
   * @inheritDoc
   */
  public resolveCapabilitiesByIntent(intent: Intent, appSymbolicName: string): Capability[] {
    const illegalQualifierError = Qualifiers.validateQualifier(intent.qualifier, {exactQualifier: true});
    if (illegalQualifierError) {
      throw illegalQualifierError;
    }

    const filter: ManifestObjectFilter = {type: intent.type, qualifier: intent.qualifier ?? {}};
    return this._capabilityStore.find(filter)
      .filter(capability => this.isApplicationQualifiedForCapability(appSymbolicName, capability));
  }

  /**
   * @inheritDoc
   */
  public hasIntention(intent: Intent, appSymbolicName: string): boolean {
    const illegalQualifierError = Qualifiers.validateQualifier(intent.qualifier, {exactQualifier: true});
    if (illegalQualifierError) {
      throw illegalQualifierError;
    }

    const filter: ManifestObjectFilter = {appSymbolicName, type: intent.type};
    const isIntentionCheckDisabled = Beans.get(ApplicationRegistry).isIntentionCheckDisabled(appSymbolicName);
    const isCapabilityActiveCheckDisabled = Beans.get(ApplicationRegistry).isCapabilityActiveCheckDisabled(appSymbolicName);

    // Tests if the app has declared an intention.
    const hasIntention = (): boolean => this._intentionStore.find({...filter, qualifier: intentionQualifier => new QualifierMatcher(intentionQualifier).matches(intent.qualifier)}).length > 0;
    // Tests if the app has an implicit intention if it provides the capability.
    const hasImplicitIntention = (): boolean => this._capabilityStore.find({...filter, qualifier: intent.qualifier ?? {}})
      .filter(capability => isCapabilityActiveCheckDisabled || !capability.inactive)
      .length > 0;

    return isIntentionCheckDisabled || hasIntention() || hasImplicitIntention();
  }

  /**
   * Tests whether the specified application is qualified to access the given capability.
   *
   * An application is qualified if following criteria are met:
   * - The capability is active (1).
   * - The capability is provided by the application, or provided by another application with
   *   public visibility (2), and the application has an intention (3) for the capability.
   *
   * (1) Unless 'Capability Active Check' is disabled for the application.
   * (2) Unless 'Scope Check' is disabled for the application.
   * (3) Unless 'Intention Check' is disabled for the application.
   */
  private isApplicationQualifiedForCapability(appSymbolicName: string, capability: Capability): boolean {
    const isScopeCheckDisabled = Beans.get(ApplicationRegistry).isScopeCheckDisabled(appSymbolicName);
    const isIntentionCheckDisabled = Beans.get(ApplicationRegistry).isIntentionCheckDisabled(appSymbolicName);
    const isCapabilityActiveCheckDisabled = Beans.get(ApplicationRegistry).isCapabilityActiveCheckDisabled(appSymbolicName);
    const isCapabilityProvider = capability.metadata!.appSymbolicName === appSymbolicName;

    // Perform active check.
    if (capability.inactive && !isCapabilityActiveCheckDisabled) {
      return false;
    }

    // Perform scope check.
    if (!isCapabilityProvider && capability.private && !isScopeCheckDisabled) {
      return false;
    }

    // Perform intention check.
    if (!isCapabilityProvider && !this.hasIntentionForCapability(appSymbolicName, capability) && !isIntentionCheckDisabled) {
      return false;
    }

    return true;
  }

  /**
   * Tests whether the given app has declared a matching intention for the given capability.
   */
  private hasIntentionForCapability(appSymbolicName: string, capability: Capability): boolean {
    return this._intentionStore.find({
      appSymbolicName,
      type: capability.type,
      qualifier: intentionQualifier => new QualifierMatcher(intentionQualifier).matches(capability.qualifier),
    }).length > 0;
  }

  public async registerCapability(capability: Capability, appSymbolicName: string): Promise<string | null> {
    if (!capability) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      throw Error('[CapabilityRegisterError] Capability must not be null or undefined.');
    }
    if (!capability.type) {
      throw Error('[CapabilityRegisterError] Missing capability property: type');
    }
    const illegalQualifierError = Qualifiers.validateQualifier(capability.qualifier, {exactQualifier: true});
    if (illegalQualifierError) {
      throw illegalQualifierError;
    }

    assertCapabilityParamDefinitions(capability.params);

    // Let the host app intercept the capability to register.
    const capabilityToRegister = await interceptCapability({
      ...capability,
      qualifier: capability.qualifier ?? {},
      params: capability.params ?? [],
      private: capability.private ?? true,
      inactive: capability.inactive ?? false,
      metadata: {
        id: UUID.randomUUID(),
        appSymbolicName: appSymbolicName,
      },
    });

    // Register the capability.
    if (capabilityToRegister) {
      this._capabilityStore.add(capabilityToRegister);
      return capabilityToRegister.metadata!.id;
    }
    return null;
  }

  public unregisterCapabilities(appSymbolicName: string, filter: ManifestObjectFilter): void {
    this._capabilityStore.remove({...filter, appSymbolicName});
  }

  public registerIntention(intention: Intention, appSymbolicName: string): string {
    if (!intention) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      throw Error('[IntentionRegisterError] Intention must not be null or undefined.');
    }
    if (!intention.type) {
      throw Error('[IntentionRegisterError] Missing intention property: type');
    }
    const illegalQualifierError = Qualifiers.validateQualifier(intention.qualifier, {exactQualifier: false});
    if (illegalQualifierError) {
      throw illegalQualifierError;
    }

    const intentionToRegister: Intention = {
      ...intention,
      metadata: {
        id: UUID.randomUUID(),
        appSymbolicName: appSymbolicName,
      },
    };

    // Register the intention.
    this._intentionStore.add(intentionToRegister);
    return intentionToRegister.metadata!.id;
  }

  private unregisterIntention(appSymbolicName: string, filter: ManifestObjectFilter): void {
    this._intentionStore.remove({...filter, appSymbolicName});
  }

  private installCapabilityRegisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<Capability, string | null>(PlatformTopics.RegisterCapability, (request: TopicMessage<Capability>) => {
      const capability = request.body!;
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName) as string;
      return this.registerCapability(capability, appSymbolicName);
    }));
  }

  private installCapabilityUnregisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, void>(PlatformTopics.UnregisterCapabilities, (request: TopicMessage<ManifestObjectFilter>) => {
      const capabilityFilter = request.body ?? {};
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName) as string;
      this.unregisterCapabilities(appSymbolicName, capabilityFilter);
    }));
  }

  private installIntentionRegisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<Intention, string>(PlatformTopics.RegisterIntention, (request: TopicMessage<Intention>) => {
      const intention = request.body!;
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName) as string;
      assertIntentionRegisterApiEnabled(appSymbolicName);
      return this.registerIntention(intention, appSymbolicName);
    }));
  }

  private installIntentionUnregisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, void>(PlatformTopics.UnregisterIntentions, (request: TopicMessage<ManifestObjectFilter>) => {
      const intentFilter = request.body ?? {};
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName) as string;
      assertIntentionRegisterApiEnabled(appSymbolicName);
      this.unregisterIntention(appSymbolicName, intentFilter);
    }));
  }

  private installCapabilitiesLookupRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, Capability[]>(PlatformTopics.LookupCapabilities, (request: TopicMessage<ManifestObjectFilter>) => {
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName) as string;
      const lookupFilter = request.body ?? {};

      const illegalQualifierError = Qualifiers.validateQualifier(lookupFilter.qualifier, {exactQualifier: false});
      if (illegalQualifierError) {
        throw illegalQualifierError;
      }

      // The queried capabilities may change on both, capability or intention change, because the computation
      // of visible and qualified capabilities depends on registered capabilities and manifested intentions.
      const registryChange$ = merge(this._capabilityStore.change$, this._intentionStore.change$);
      const finder$ = defer(() => of(this._capabilityStore.find(lookupFilter)));
      return finder$
        .pipe(
          expand(() => registryChange$.pipe(take(1), mergeMap(() => finder$))),
          filterArray(capability => this.isApplicationQualifiedForCapability(appSymbolicName, capability)),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        );
    }));
  }

  private installIntentionsLookupRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, Intention[]>(PlatformTopics.LookupIntentions, (request: TopicMessage<ManifestObjectFilter>) => {
      const lookupFilter = request.body ?? {};

      const illegalQualifierError = Qualifiers.validateQualifier(lookupFilter.qualifier, {exactQualifier: false});
      if (illegalQualifierError) {
        throw illegalQualifierError;
      }

      const finder$ = defer(() => of(this._intentionStore.find(lookupFilter)));
      return finder$
        .pipe(
          expand(() => this._intentionStore.change$.pipe(take(1), mergeMap(() => finder$))),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        );
    }));
  }

  private installIsApplicationQualifiedRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ApplicationQualifiedForCapabilityRequest, boolean>(PlatformTopics.IsApplicationQualifiedForCapability, (request: TopicMessage<ApplicationQualifiedForCapabilityRequest>) => {
      return merge(this._intentionStore.change$, this._capabilityStore.change$)
        .pipe(
          startWith<void>(undefined),
          map(() => {
            const application = Beans.get(ApplicationRegistry).getApplication(request.body!.appSymbolicName);
            const capability = this._capabilityStore.findById(request.body!.capabilityId);
            return this.isApplicationQualifiedForCapability(application.symbolicName, capability);
          }),
          distinctUntilChanged(),
        );
    }));
  }

  private installVersionLookupHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<void, string>(PlatformTopics.platformVersion(':appSymbolicName'), message => {
      const appSymbolicName = message.params!.get('appSymbolicName')!;
      const clientRegister$ = Beans.get(ClientRegistry).register$.pipe(filter(client => client.application.symbolicName === appSymbolicName));
      const platformVersion$ = defer(() => {
        const clients = Beans.get(ClientRegistry).getByApplication(appSymbolicName);
        return clients.length ? of(clients[0]!.version) : EMPTY;
      });
      return platformVersion$
        .pipe(
          concatWith(clientRegister$.pipe(mergeMap(() => platformVersion$))),
          take(1),
        );
    }));
  }

  public preDestroy(): void {
    this._subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

/**
 * Checks if the 'Intention Registration API' is enabled for the given app. If not, an error is thrown.
 */
function assertIntentionRegisterApiEnabled(appSymbolicName: string): void {
  if (Beans.get(ApplicationRegistry).isIntentionRegisterApiDisabled(appSymbolicName)) {
    throw Error(`[IntentionRegisterError] The 'Intention Registration API' is disabled for the application '${appSymbolicName}'. Contact the platform administrator to enable this API.`);
  }
}

/**
 * Asserts given parameter definitions to be valid.
 */
function assertCapabilityParamDefinitions(params: Partial<ParamDefinition>[] | undefined): void {
  if (!params?.length) {
    return;
  }

  const validSubstitutes = params.filter(param => !param.deprecated).map(param => param.name);

  params.forEach(param => {
    if (param.required === undefined) {
      throw Error(`[CapabilityParamError] Parameter '${param.name}' must be explicitly defined as required or optional.`);
    }

    if (param.deprecated !== undefined) {
      // Ensure deprecated param to be optional
      if (param.required) {
        throw Error(`[CapabilityParamError] Deprecated parameters must be optional, not required. Alternatively, deprecated parameters can define a mapping to a required parameter via the 'useInstead' property. [param='${param.name}']`);
      }

      // Ensure existing substitute
      if (typeof param.deprecated === 'object' && param.deprecated.useInstead && !validSubstitutes.includes(param.deprecated.useInstead)) {
        throw Error(`[CapabilityParamError] The deprecated parameter '${param.name}' defines an invalid substitute '${param.deprecated.useInstead}'. Valid substitutes are: [${validSubstitutes}]`);
      }
    }
    return param;
  });
}

/**
 * Intercepts capability before its registration.
 */
async function interceptCapability(capability: Capability): Promise<Capability | null> {
  const interceptors = Beans.all(CapabilityInterceptor);
  const appSymbolicName = capability.metadata!.appSymbolicName;
  const manifest = new class implements CapabilityInterceptor.Manifest {
    public addCapability<T extends Capability>(capability: T): Promise<string | null> {
      return Beans.get(ManifestRegistry).registerCapability(capability, appSymbolicName);
    }

    public async addIntention(intention: Intention): Promise<string> {
      return Beans.get(ManifestRegistry).registerIntention(intention, appSymbolicName);
    }
  }();

  let interceptedCapability: Capability | null = capability;
  for (const interceptor of interceptors) {
    interceptedCapability = await interceptor.intercept(interceptedCapability, manifest);
    if (interceptedCapability === null) {
      break; // rejected by the interceptor
    }
  }
  return interceptedCapability;
}
