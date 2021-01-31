/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { EMPTY, Observable, Subject } from 'rxjs';
import { MessageClient } from '../messaging/message-client';
import { Application, Capability, Intention } from '../../platform.model';
import { mergeMapTo, take, takeUntil } from 'rxjs/operators';
import { PlatformTopics } from '../../ɵmessaging.model';
import { ManifestRegistryTopics } from '../../host/manifest-registry/ɵmanifest-registry';
import { ManifestObjectFilter } from '../../host/manifest-registry/manifest-object-store';
import { mapToBody, throwOnErrorStatus } from '../../messaging.model';
import { Beans, PreDestroy } from '@scion/toolkit/bean-manager';

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
   *
   * @internal
   */
  public whenApplicationsLoaded: Promise<void>;

  constructor(private _messageClient: MessageClient = Beans.get(MessageClient)) {
    this.whenApplicationsLoaded = this.loadApplications();
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
    return this._messageClient.observe$<Application[]>(PlatformTopics.Applications)
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
   *         If given a qualifier in the filter, the qualifier can be either exact or contain wildcards to match
   *         multiple capabilities. The asterisk wildcard (`*`), if used as a qualifier entry value, requires capabilities to have such
   *         an entry. An even more lenient option is the optional wildcard (`?`), which does not require the qualifier entry at all.
   *         And finally, if using the asterisk wildcard (`*`) as the qualifier key, capabilities may contain additional qualifier entries.
   * @return An Observable that, when subscribed, emits the requested capabilities.
   *         It never completes and emits continuously when satisfying capabilities are registered or unregistered.
   */
  public lookupCapabilities$<T extends Capability>(filter?: ManifestObjectFilter): Observable<T[]> {
    return this._messageClient.request$<T[]>(ManifestRegistryTopics.LookupCapabilities, filter)
      .pipe(
        throwOnErrorStatus(),
        mapToBody(),
      );
  }

  /**
   * Allows to lookup any intentions that match the given filter.
   *
   * @param  filter - Control which intentions to return. If no or an empty filter is given, no filtering takes place. Specified filter
   *         criteria are "AND"ed together.\
   *         <p>
   *         If given a qualifier in the filter, the qualifier can be either exact or contain wildcards to match
   *         multiple intentions. The asterisk wildcard (`*`), if used as a qualifier entry value, requires intentions to have such
   *         an entry. An even more lenient option is the optional wildcard (`?`), which does not require the qualifier entry at all.
   *         And finally, if using the asterisk wildcard (`*`) as the qualifier key, intentions may contain additional qualifier entries.
   * @return An Observable that, when subscribed, emits the requested intentions.
   *         It never completes and emits continuously when satisfying intentions are registered or unregistered.
   */
  public lookupIntentions$(filter?: ManifestObjectFilter): Observable<Intention[]> {
    return this._messageClient.request$<Intention[]>(ManifestRegistryTopics.LookupIntentions, filter)
      .pipe(
        throwOnErrorStatus(),
        mapToBody(),
      );
  }

  /**
   * Registers the current app as provider for the given capability.
   *
   * @return A Promise that resolves to the identity of the registered capability,
   *         or that rejects if the registration failed.
   */
  public registerCapability<T extends Capability>(capability: T): Promise<string> {
    return this._messageClient.request$<string>(ManifestRegistryTopics.RegisterCapability, capability)
      .pipe(
        throwOnErrorStatus(),
        take(1),
        mapToBody(),
      )
      .toPromise();
  }

  /**
   * Unregisters the current app as provider for capabilities matching the given filter.
   *
   * <strong>The app can only unregister capabilities it provides itself.</strong>
   *
   * @param  filter - Control which capabilities to unregister by specifying filter criteria which are "AND"ed together.\
   *         <p>
   *         If no or an empty filter is given, all capabilities of the requesting app are unregistered.\
   *         If given a qualifier in the filter, wildcards, if any, are not interpreted as wildcards, but as exact values instead.\
   *         If given an app symbolic name in the filter, it is ignored.
   * @return A Promise that resolves when unregistered the capability,
   *         or that rejects if the unregistration failed.
   */
  public unregisterCapabilities(filter?: ManifestObjectFilter): Promise<void> {
    return this._messageClient.request$<void>(ManifestRegistryTopics.UnregisterCapabilities, filter)
      .pipe(
        throwOnErrorStatus(),
        take(1),
        mergeMapTo(EMPTY),
      )
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
    return this._messageClient.request$<string>(ManifestRegistryTopics.RegisterIntention, intention)
      .pipe(
        throwOnErrorStatus(),
        take(1),
        mapToBody(),
      )
      .toPromise();
  }

  /**
   * Unregisters intentions of the requesting application which match the given filter.
   *
   * <strong>This operation requires that the 'Intention Registration API' is enabled for the requesting application.</strong>
   *
   * @param  filter - Control which intentions to unregister by specifying filter criteria which are "AND"ed together.\
   *         <p>
   *         If no or an empty filter is given, all intentions of the requesting app are unregistered.\
   *         If given a qualifier in the filter, wildcards, if any, are not interpreted as wildcards, but as exact values instead.\
   *         If given an app symbolic name in the filter, it is ignored.
   * @return A Promise that resolves when unregistered the intention,
   *         or that rejects if the unregistration failed.
   */
  public unregisterIntentions(filter?: ManifestObjectFilter): Promise<void> {
    return this._messageClient.request$<void>(ManifestRegistryTopics.UnregisterIntentions, filter)
      .pipe(
        throwOnErrorStatus(),
        take(1),
        mergeMapTo(EMPTY),
      )
      .toPromise()
      .then(() => Promise.resolve()); // resolve to `void`
  }

  private async loadApplications(): Promise<void> {
    this._applications = await this._messageClient.observe$<Application[]>(PlatformTopics.Applications)
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
