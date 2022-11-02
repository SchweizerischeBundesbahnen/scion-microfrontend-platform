/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Capability, Intention, ParamDefinition} from '../../platform.model';
import {sha256} from 'js-sha256';
import {ManifestObjectStore} from './manifest-object-store';
import {concatWith, defer, EMPTY, filter, merge, of, Subject} from 'rxjs';
import {distinctUntilChanged, expand, mergeMap, take, takeUntil} from 'rxjs/operators';
import {Intent, MessageHeaders, ResponseStatusCodes, TopicMessage} from '../../messaging.model';
import {MessageClient, takeUntilUnsubscribe} from '../../client/messaging/message-client';
import {ApplicationRegistry} from '../application-registry';
import {runSafe} from '../../safe-runner';
import {filterArray} from '@scion/toolkit/operators';
import {ManifestRegistry} from './manifest-registry';
import {assertExactQualifier, QualifierMatcher} from '../../qualifier-matcher';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {stringifyError} from '../../error.util';
import {Logger, LoggingContext} from '../../logger';
import {ManifestObjectFilter} from './manifest-object.model';
import {ClientRegistry} from '../client-registry/client.registry';
import {CapabilityInterceptor} from './capability-interceptors';

export class ɵManifestRegistry implements ManifestRegistry, PreDestroy {

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
    this.installVersionLookupHandler();
  }

  /**
   * @inheritDoc
   */
  public resolveCapabilitiesByIntent(intent: Intent, appSymbolicName: string): Capability[] {
    assertExactQualifier(intent.qualifier);
    const filter: ManifestObjectFilter = {type: intent.type, qualifier: intent.qualifier || {}};
    return this._capabilityStore.find(filter, capabilityQualifier => new QualifierMatcher(capabilityQualifier, {evalAsterisk: true, evalOptional: true}).matches(intent.qualifier))
      .filter(capability => this.isApplicationQualifiedForCapability(appSymbolicName, capability));
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
    const filter: ManifestObjectFilter = {appSymbolicName, type: capability.type, qualifier: capability.qualifier};
    return this._intentionStore.find(filter, intentionQualifier => new QualifierMatcher(intentionQualifier, {evalAsterisk: true, evalOptional: true}).matches(capability.qualifier)).length > 0;
  }

  public async registerCapability(capability: Capability, appSymbolicName: string): Promise<string> {
    if (!capability) {
      throw Error('[CapabilityRegisterError] Missing required capability.');
    }
    if (capability.qualifier && capability.qualifier.hasOwnProperty('*')) {
      throw Error('[CapabilityRegisterError] Asterisk wildcard (\'*\') not allowed in the qualifier key.');
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
        // use the first 7 digits of the capability hash as capability id
        id: sha256(JSON.stringify({application: appSymbolicName, type: capability.type, ...capability.qualifier})).substring(0, 7),
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
      throw Error(`[IntentionRegisterError] Missing required intention.`);
    }

    // use the first 7 digits of the intention hash as intention id
    const intentionId = sha256(JSON.stringify({application: appSymbolicName, type: intention.type, ...intention.qualifier})).substring(0, 7);
    const intentionToRegister: Intention = {
      ...intention,
      metadata: {
        id: intentionId,
        appSymbolicName: appSymbolicName,
      },
    };

    // Register the intention.
    this._intentionStore.add(intentionToRegister);
    return intentionId;
  }

  private unregisterIntention(appSymbolicName: string, filter: ManifestObjectFilter): void {
    this._intentionStore.remove({...filter, appSymbolicName});
  }

  private installCapabilityRegisterRequestHandler(): void {
    Beans.get(MessageClient).observe$<Capability>(ManifestRegistryTopics.RegisterCapability)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<Capability>) => runSafe(async () => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const capability = request.body!;
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          const capabilityId = await this.registerCapability(capability, appSymbolicName);
          Beans.get(MessageClient).publish(replyTo, capabilityId, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(MessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installCapabilityUnregisterRequestHandler(): void {
    Beans.get(MessageClient).observe$<ManifestObjectFilter>(ManifestRegistryTopics.UnregisterCapabilities)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const capabilityFilter = request.body || {};
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          this.unregisterCapabilities(appSymbolicName, capabilityFilter);
          Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(MessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installIntentionRegisterRequestHandler(): void {
    Beans.get(MessageClient).observe$<Intention>(ManifestRegistryTopics.RegisterIntention)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<Intention>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const intention = request.body!;
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          assertIntentionRegisterApiEnabled(appSymbolicName);
          const intentionId = this.registerIntention(intention, appSymbolicName);
          Beans.get(MessageClient).publish(replyTo, intentionId, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(MessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installIntentionUnregisterRequestHandler(): void {
    Beans.get(MessageClient).observe$<ManifestObjectFilter>(ManifestRegistryTopics.UnregisterIntentions)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const intentFilter = request.body || {};
        const appSymbolicName = request.headers.get(MessageHeaders.AppSymbolicName);

        try {
          assertIntentionRegisterApiEnabled(appSymbolicName);
          this.unregisterIntention(appSymbolicName, intentFilter);
          Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
        }
        catch (error) {
          Beans.get(MessageClient).publish(replyTo, stringifyError(error), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
        }
      }));
  }

  private installCapabilitiesLookupRequestHandler(): void {
    Beans.get(MessageClient).observe$<ManifestObjectFilter>(ManifestRegistryTopics.LookupCapabilities)
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
            expand(() => registryChange$.pipe(take(1), mergeMap(() => finder$))),
            filterArray(capability => this.isApplicationQualifiedForCapability(appSymbolicName, capability)),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            takeUntilUnsubscribe(replyTo),
          )
          .subscribe(capabilities => { // eslint-disable-line rxjs/no-nested-subscribe
            Beans.get(MessageClient).publish<Capability[]>(replyTo, capabilities, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
          });
      }));
  }

  private installIntentionsLookupRequestHandler(): void {
    Beans.get(MessageClient).observe$<ManifestObjectFilter>(ManifestRegistryTopics.LookupIntentions)
      .pipe(takeUntil(this._destroy$))
      .subscribe((request: TopicMessage<ManifestObjectFilter>) => runSafe(() => {
        const replyTo = request.headers.get(MessageHeaders.ReplyTo);
        const lookupFilter = request.body || {};

        const finder$ = defer(() => of(this._intentionStore.find(lookupFilter)));
        return finder$
          .pipe(
            expand(() => this._intentionStore.change$.pipe(take(1), mergeMap(() => finder$))),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            takeUntilUnsubscribe(replyTo),
          )
          .subscribe(intentions => { // eslint-disable-line rxjs/no-nested-subscribe
            Beans.get(MessageClient).publish<Intention[]>(replyTo, intentions, {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
          });
      }));
  }

  private installVersionLookupHandler(): void {
    Beans.get(MessageClient).onMessage<void, string>(ManifestRegistryTopics.platformVersion(':appSymbolicName'), message => {
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
    });
  }

  public preDestroy(): void {
    this._destroy$.next();
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
  export const LookupPlatformVersion = 'ɵLOOKUP_PLATFORM_VERSION';

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
