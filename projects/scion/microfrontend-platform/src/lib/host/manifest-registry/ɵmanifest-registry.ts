/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Capability, Intention, ParamDefinition} from '../../platform.model';
import {ManifestObjectStore, ɵManifestObjectFilter} from './manifest-object-store';
import {concatWith, defer, EMPTY, filter, merge, Observable, of, Subscription} from 'rxjs';
import {distinctUntilChanged, expand, mergeMap, take} from 'rxjs/operators';
import {Intent, MessageHeaders, TopicMessage} from '../../messaging.model';
import {MessageClient} from '../../client/messaging/message-client';
import {ApplicationRegistry} from '../application-registry';
import {filterArray} from '@scion/toolkit/operators';
import {ManifestRegistry} from './manifest-registry';
import {QualifierMatcher} from '../../qualifier-matcher';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {Logger, LoggingContext} from '../../logger';
import {ManifestObjectFilter} from './manifest-object.model';
import {ClientRegistry} from '../client-registry/client.registry';
import {CapabilityInterceptor} from './capability-interceptors';
import {UUID} from '@scion/toolkit/uuid';
import {Qualifiers} from '../../qualifiers.util';

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

    const filter: ManifestObjectFilter = {type: intent.type, qualifier: intent.qualifier || {}};
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
    return (
      Beans.get(ApplicationRegistry).isIntentionCheckDisabled(appSymbolicName) ||
      this._intentionStore.find({...filter, qualifier: intentionQualifier => new QualifierMatcher(intentionQualifier).matches(intent.qualifier)}).length > 0 ||
      this._capabilityStore.find({...filter, qualifier: intent.qualifier || {}}).length > 0  // An app has an implicit intention if it provides the capability itself
    );
  }

  /**
   * Tests whether the given micro app is qualified for the given capability. This is true in two cases:
   *   - The micro app provides the capability itself.
   *   - The capability has public visibility and the micro app has declared an intention for it.
   *     If 'scope check' is disabled for the given micro app, it also qualifies for capabilities with private visibility.
   *     If 'intention check' is disabled for the given micro app, it also qualifies for capabilities for which it has not declared a respective intention.
   */
  private isApplicationQualifiedForCapability(appSymbolicName: string, capability: Capability): boolean {
    if (capability.metadata!.appSymbolicName === appSymbolicName) {
      return true;
    }
    const isCapabilityPublic = !capability.private;
    const isScopeCheckDisabled = Beans.get(ApplicationRegistry).isScopeCheckDisabled(appSymbolicName);
    const isIntentionCheckDisabled = Beans.get(ApplicationRegistry).isIntentionCheckDisabled(appSymbolicName);
    return (isScopeCheckDisabled || isCapabilityPublic) && (isIntentionCheckDisabled || this.hasIntentionForCapability(appSymbolicName, capability));
  }

  /**
   * Tests whether the given app has declared a matching intention for the given capability.
   */
  private hasIntentionForCapability(appSymbolicName: string, capability: Capability): boolean {
    const filter: ɵManifestObjectFilter = {appSymbolicName, type: capability.type, qualifier: intentionQualifier => new QualifierMatcher(intentionQualifier).matches(capability.qualifier)};
    return this._intentionStore.find(filter).length > 0;
  }

  public async registerCapability(capability: Capability, appSymbolicName: string): Promise<string> {
    if (!capability) {
      throw Error('[CapabilityRegisterError] Capability must not be null or undefined.');
    }
    if (!capability.type) {
      throw Error('[CapabilityRegisterError] Missing capability property: type');
    }
    const illegalQualifierError = Qualifiers.validateLegacyCapabilityQualifier(capability.qualifier) || Qualifiers.validateQualifier(capability.qualifier, {exactQualifier: true});
    if (illegalQualifierError) {
      throw illegalQualifierError;
    }

    // Let the host app intercept the capability to register.
    const capabilityToRegister = await interceptCapability({
      ...capability,
      qualifier: capability.qualifier ?? {},
      params: coerceCapabilityParamDefinitions(capability, appSymbolicName),
      requiredParams: undefined,
      optionalParams: undefined,
      private: capability.private ?? true,
      metadata: {
        id: UUID.randomUUID(),
        appSymbolicName: appSymbolicName,
      },
    });

    // Register the capability.
    this._capabilityStore.add(capabilityToRegister);
    return capabilityToRegister.metadata!.id;
  }

  private unregisterCapabilities(appSymbolicName: string, filter: ManifestObjectFilter): void {
    this._capabilityStore.remove({...filter, appSymbolicName});
  }

  public registerIntention(intention: Intention, appSymbolicName: string): string {
    if (!intention) {
      throw Error('[IntentionRegisterError] Intention must not be null or undefined.');
    }
    if (!intention.type) {
      throw Error('[IntentionRegisterError] Missing intention property: type');
    }
    const illegalQualifierError = Qualifiers.validateLegacyIntentionQualifier(intention.qualifier) || Qualifiers.validateQualifier(intention.qualifier, {exactQualifier: false});
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
    this._subscriptions.add(Beans.get(MessageClient).onMessage<Capability, string>(ManifestRegistryTopics.RegisterCapability, (request: TopicMessage<Capability>) => {
      const capability = request.body!;
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);
      return this.registerCapability(capability, appSymbolicName);
    }));
  }

  private installCapabilityUnregisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, void>(ManifestRegistryTopics.UnregisterCapabilities, (request: TopicMessage<ManifestObjectFilter>) => {
      const capabilityFilter = request.body || {};
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);
      this.unregisterCapabilities(appSymbolicName, capabilityFilter);
    }));
  }

  private installIntentionRegisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<Intention, string>(ManifestRegistryTopics.RegisterIntention, (request: TopicMessage<Intention>) => {
      const intention = request.body!;
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);
      assertIntentionRegisterApiEnabled(appSymbolicName);
      return this.registerIntention(intention, appSymbolicName);
    }));
  }

  private installIntentionUnregisterRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, void>(ManifestRegistryTopics.UnregisterIntentions, (request: TopicMessage<ManifestObjectFilter>) => {
      const intentFilter = request.body || {};
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);
      assertIntentionRegisterApiEnabled(appSymbolicName);
      this.unregisterIntention(appSymbolicName, intentFilter);
    }));
  }

  private installCapabilitiesLookupRequestHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, Capability[]>(ManifestRegistryTopics.LookupCapabilities, (request: TopicMessage<ManifestObjectFilter>) => {
      const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);
      const lookupFilter = request.body || {};

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
    this._subscriptions.add(Beans.get(MessageClient).onMessage<ManifestObjectFilter, Intention[]>(ManifestRegistryTopics.LookupIntentions, (request: TopicMessage<ManifestObjectFilter>) => {
      const lookupFilter = request.body || {};

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

  private installVersionLookupHandler(): void {
    this._subscriptions.add(Beans.get(MessageClient).onMessage<void, string>(ManifestRegistryTopics.platformVersion(':appSymbolicName'), message => {
      const appSymbolicName = message.params!.get('appSymbolicName')!;
      const clientRegister$ = Beans.get(ClientRegistry).register$.pipe(filter(client => client.application.symbolicName === appSymbolicName));
      const platformVersion$ = defer(() => {
        const clients = Beans.get(ClientRegistry).getByApplication(appSymbolicName);
        return clients.length ? of(clients[0].version) : EMPTY;
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
 * Defines the topics to interact with the manifest registry from {@link ManifestService}.
 */
export namespace ManifestRegistryTopics {
  export const LookupCapabilities = 'ɵLOOKUP_CAPABILITIES';
  export const LookupIntentions = 'ɵLOOKUP_INTENTIONS';
  export const RegisterCapability = 'ɵREGISTER_CAPABILITY';
  export const UnregisterCapabilities = 'ɵUNREGISTER_CAPABILITIES';
  export const RegisterIntention = 'ɵREGISTER_INTENTION';
  export const UnregisterIntentions = 'ɵUNREGISTER_INTENTIONS';

  export function platformVersion(appSymbolicName: string): string {
    return `ɵapplication/${appSymbolicName}/platform/version`;
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

function coerceCapabilityParamDefinitions(capability: Capability, appSymbolicName: string): ParamDefinition[] {
  const params: ParamDefinition[] = [];

  capability.requiredParams?.forEach(name => { // eslint-disable-line deprecation/deprecation
    params.push({name, required: true});
    const migration = `{ params: [{name: '${name}', required: true}] }`;
    Beans.get(Logger).warn(`[DEPRECATION][AC3A912] The '${appSymbolicName}' application uses a deprecated API for declaring required parameters of a capability. The API will be removed in a future release. To migrate, declare parameters by using the 'Capability#params' property, as follows: ${migration}`, new LoggingContext(appSymbolicName), capability);
  });
  capability.optionalParams?.forEach(name => { // eslint-disable-line deprecation/deprecation
    params.push({name, required: false});
    const migration = `{ params: [{name: '${name}', required: false}] }`;
    Beans.get(Logger).warn(`[DEPRECATION][97C70E9] The '${appSymbolicName}' application uses a deprecated API for declaring optional parameters of a capability. The API will be removed in a future release. To migrate, declare parameters by using the 'Capability#params' property, as follows: ${migration}`, new LoggingContext(appSymbolicName), capability);
  });
  capability.params?.forEach(param => {
    params.push(param);
  });

  assertCapabilityParamDefinitions(params);
  return params;
}

/**
 * Asserts given parameter definitions to be valid.
 */
function assertCapabilityParamDefinitions(params: ParamDefinition[]): void {
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
async function interceptCapability(capability: Capability): Promise<Capability> {
  const interceptors = Beans.all(CapabilityInterceptor);
  for (const interceptor of interceptors) {
    capability = await interceptor.intercept(capability);
  }
  return capability;
}
