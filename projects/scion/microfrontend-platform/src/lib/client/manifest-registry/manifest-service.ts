/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {EMPTY, Observable, Subject} from 'rxjs';
import {MessageClient} from '../messaging/message-client';
import {Application, Capability, Intention} from '../../platform.model';
import {mergeMapTo, take, takeUntil} from 'rxjs/operators';
import {PlatformTopics} from '../../ɵmessaging.model';
import {ManifestRegistryTopics} from '../../host/manifest-registry/ɵmanifest-registry';
import {ManifestObjectFilter} from '../../host/manifest-registry/manifest-object-store';
import {mapToBody} from '../../messaging.model';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {BrokerGateway, NullBrokerGateway} from '../messaging/broker-gateway';

/**
 * Allows looking up capabilities available to the current app and managing the capabilities it provides.
 *
 * The app can query all capabilities which are visible to it, i.e., for which the app has declared an intention
 * and which are also publicly available. Capabilities that the app provides itself are always visible to the app.
 *
 * The app can also provide new capabilities to the platform or remove self-provided ones. If the *Intention Registration API*
 * is enabled for the app, the app can also manage its intentions, which, however, is strongly discouraged. Instead, apps should
 * declare the required functionality in their manifests using wildcard intentions.
 *
 * @category Manifest
 */
export class ManifestService implements PreDestroy {

  private _destroy$ = new Subject<void>();
  private _applications: Application[] = [];

  /**
   * Promise that resolves when loaded the applications from the host.
   * If messaging is disabled, the Promise resolves immediately.
   *
   * @internal
   */
  public whenApplicationsLoaded: Promise<void>;

  constructor() {
    const messagingDisabled = Beans.get(BrokerGateway) instanceof NullBrokerGateway;
    this.whenApplicationsLoaded = messagingDisabled ? Promise.resolve() : this.requestApplications();
  }

  /**
   * Applications installed in the platform.
   */
  public get applications(): ReadonlyArray<Application> {
    return this._applications;
  }

  /**
   * Allows to lookup the applications installed in the platform.
   *
   * @return an Observable that emits the applications in the platform and then completes.
   * @deprecated since version 1.0.0-beta.8. Use {@link applications} instead.
   */
  public lookupApplications$(): Observable<Application[]> {
    return Beans.get(MessageClient).observe$<Application[]>(PlatformTopics.Applications)
      .pipe(
        take(1),
        mapToBody(),
      );
  }

  /**
   * Allows to lookup capabilities that match the given filter.
   *
   * <strong>
   * The app can query all capabilities which are visible to it, i.e., for which the app has declared an intention and which are also
   * publicly available. Capabilities that the app provides itself are always visible to the app.
   * </strong>
   *
   * @param  filter - Control which capabilities to return. If no or an empty filter is given, all capabilities visible to the requesting
   *         app are returned. Specified filter criteria are "AND"ed together.\
   *         <p>
   *         If specifying a qualifier filter, the capabilities must match that filter exactly. The filter supports the asterisk wildcard
   *         to match any value, e.g., `{property: '*'}`, or partial matching to find capabilities with at least the specified qualifier
   *         properties. Partial matching is enabled by appending the _any-more_ entry to the qualifier, as following: `{'*': '*'}`.
   * @return An Observable that, when subscribed, emits the requested capabilities.
   *         It never completes and emits continuously when satisfying capabilities are registered or unregistered.
   */
  public lookupCapabilities$<T extends Capability>(filter?: ManifestObjectFilter): Observable<T[]> {
    return Beans.get(MessageClient).request$<T[]>(ManifestRegistryTopics.LookupCapabilities, filter)
      .pipe(mapToBody());
  }

  /**
   * Allows to lookup any intentions that match the given filter.
   *
   * @param  filter - Control which intentions to return. If no or an empty filter is given, no filtering takes place. Specified filter
   *         criteria are "AND"ed together.\
   *         <p>
   *         If specifying a qualifier filter, the intentions must match that filter exactly. The filter supports the asterisk wildcard
   *         to match any value, e.g., `{property: '*'}`, or partial matching to find intentions with at least the specified qualifier
   *         properties. Partial matching is enabled by appending the _any-more_ entry to the qualifier, as following: `{'*': '*'}`.
   * @return An Observable that, when subscribed, emits the requested intentions.
   *         It never completes and emits continuously when satisfying intentions are registered or unregistered.
   */
  public lookupIntentions$(filter?: ManifestObjectFilter): Observable<Intention[]> {
    return Beans.get(MessageClient).request$<Intention[]>(ManifestRegistryTopics.LookupIntentions, filter)
      .pipe(mapToBody());
  }

  /**
   * Registers the current app as provider for the given capability.
   *
   * @return A Promise that resolves to the identity of the registered capability,
   *         or that rejects if the registration failed.
   */
  public registerCapability<T extends Capability>(capability: T): Promise<string> {
    return Beans.get(MessageClient).request$<string>(ManifestRegistryTopics.RegisterCapability, capability)
      .pipe(mapToBody())
      .toPromise();
  }

  /**
   * Unregisters the current app as provider for capabilities matching the given filter.
   *
   * <strong>The app can only unregister capabilities it provides itself.</strong>
   *
   * @param  filter - Control which capabilities to unregister by specifying filter criteria which are "AND"ed together. If not passing a filter,
   *         all capabilities of the requesting app are unregistered.\
   *         <p>
   *         If specifying a qualifier filter, the capabilities to unregister must match that filter exactly. The filter supports the asterisk
   *         wildcard to match any value, e.g., `{property: '*'}`, or partial matching to unregister capabilities with at least the specified
   *         qualifier properties. Partial matching is enabled by appending the _any-more_ entry to the qualifier, as following: `{'*': '*'}`.
   *         Note that specifying a symbolic app name in the filter has no effect.
   * @return A Promise that resolves when unregistered the capability,
   *         or that rejects if the unregistration failed.
   */
  public unregisterCapabilities(filter?: ManifestObjectFilter): Promise<void> {
    return Beans.get(MessageClient).request$<void>(ManifestRegistryTopics.UnregisterCapabilities, filter)
      .pipe(mergeMapTo(EMPTY))
      .toPromise()
      .then(() => Promise.resolve()); // resolve to `void`
  }

  /**
   * Registers the given intention for the requesting application.
   *
   * <strong>This operation requires that the 'Intention Registration API' is enabled for the requesting application.</strong>
   *
   * @return A Promise that resolves to the identity of the registered intention,
   *         or that rejects if the registration failed.
   */
  public registerIntention(intention: Intention): Promise<string> {
    return Beans.get(MessageClient).request$<string>(ManifestRegistryTopics.RegisterIntention, intention)
      .pipe(mapToBody())
      .toPromise();
  }

  /**
   * Unregisters intentions of the requesting application which match the given filter.
   *
   * <strong>This operation requires that the 'Intention Registration API' is enabled for the requesting application.</strong>
   *
   * @param  filter - Control which intentions to unregister by specifying filter criteria which are "AND"ed together. If not passing a filter,
   *         all intentions of the requesting app are unregistered.\
   *         <p>
   *         If specifying a qualifier filter, the intentions to unregister must match that filter exactly. The filter supports the asterisk
   *         wildcard to match any value, e.g., `{property: '*'}`, or partial matching to unregister intentions with at least the specified
   *         qualifier properties. Partial matching is enabled by appending the _any-more_ entry to the qualifier, as following: `{'*': '*'}`.
   *         Note that specifying a symbolic app name in the filter has no effect.
   * @return A Promise that resolves when unregistered the intention,
   *         or that rejects if the unregistration failed.
   */
  public unregisterIntentions(filter?: ManifestObjectFilter): Promise<void> {
    return Beans.get(MessageClient).request$<void>(ManifestRegistryTopics.UnregisterIntentions, filter)
      .pipe(mergeMapTo(EMPTY))
      .toPromise()
      .then(() => Promise.resolve()); // resolve to `void`
  }

  private async requestApplications(): Promise<void> {
    this._applications = await Beans.get(MessageClient).observe$<Application[]>(PlatformTopics.Applications)
      .pipe(mapToBody(), take(1), takeUntil(this._destroy$))
      .toPromise()
      .then(applications => applications || []);
  }

  /**
   * @ignore
   */
  public preDestroy(): void {
    this._destroy$.next();
  }
}
