/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {firstValueFrom, lastValueFrom, Observable, OperatorFunction} from 'rxjs';
import {MessageClient} from '../messaging/message-client';
import {Application, Capability, Intention} from '../../platform.model';
import {take} from 'rxjs/operators';
import {PlatformTopics} from '../../ɵmessaging.model';
import {ManifestRegistryTopics} from '../../host/manifest-registry/ɵmanifest-registry';
import {mapToBody} from '../../messaging.model';
import {Beans, Initializer} from '@scion/toolkit/bean-manager';
import {BrokerGateway, NullBrokerGateway} from '../messaging/broker-gateway';
import {ManifestObjectFilter} from '../../host/manifest-registry/manifest-object.model';
import {mapArray} from '@scion/toolkit/operators';
import {ɵApplication} from '../../host/application-registry';

/**
 * Allows browsing the catalog of capabilities and managing the capabilities of the application.
 *
 * The app can browse only capabilities which are visible to it, i.e., for which the app has declared an intention and
 * which are also publicly available. Capabilities that the app provides itself are always visible to the app.
 *
 * The app can also provide new capabilities or remove existing ones. If the *Intention Registration API* is enabled
 * for the app, the app can also manage its intentions, which, however, is strongly discouraged. Instead, apps should
 * declare the required functionality in their manifests using wildcard intentions.
 *
 * @category Manifest
 * @category Intention API
 */
export class ManifestService implements Initializer {

  private _applications: Application[] = [];

  public async init(): Promise<void> {
    const messagingDisabled = Beans.get(BrokerGateway) instanceof NullBrokerGateway;
    if (messagingDisabled) {
      return;
    }

    // Wait until obtained registered applications so that they can be accessed synchronously by the application via `ManifestService#applications`.
    const applications$ = Beans.get(MessageClient).observe$<ɵApplication[]>(PlatformTopics.Applications);
    this._applications = await firstValueFrom(applications$.pipe(mapToBody(), mapToApplication()));
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
    return Beans.get(MessageClient).observe$<ɵApplication[]>(PlatformTopics.Applications)
      .pipe(
        take(1),
        mapToBody(),
        mapToApplication(),
      );
  }

  /**
   * Allows browsing the catalog of capabilities that match the given filter.
   *
   * <strong>
   * You can only browse capabilities that are visible to your application, that is, capabilities that you provide yourself or that are
   * publicly available and for which you have declared an intention in your manifest.
   * </strong>
   *
   * @param  filter - Control which capabilities to browse. If no or an empty filter is given, all capabilities visible to the requesting
   *         app are returned. Specified filter criteria are "AND"ed together.\
   *         <p>
   *         If specifying a qualifier filter, the capabilities must match that filter exactly. The filter supports the asterisk wildcard
   *         to match any value, e.g., `{property: '*'}`, or partial matching to find capabilities with at least the specified qualifier
   *         properties. Partial matching is enabled by appending the _any-more_ entry to the qualifier, as following: `{'*': '*'}`.
   * @return An Observable that, when subscribed, emits the requested capabilities.
   *         It never completes and emits continuously when fulfilling capabilities are registered or unregistered.
   */
  public lookupCapabilities$<T extends Capability>(filter?: ManifestObjectFilter): Observable<T[]> {
    return Beans.get(MessageClient).request$<T[]>(ManifestRegistryTopics.LookupCapabilities, filter)
      .pipe(mapToBody());
  }

  /**
   * Allows browsing the catalog of intentions that match the given filter.
   *
   * @param  filter - Control which intentions to return. If no or an empty filter is given, no filtering takes place. Specified filter
   *         criteria are "AND"ed together.\
   *         <p>
   *         If specifying a qualifier filter, the intentions must match that filter exactly. The filter supports the asterisk wildcard
   *         to match any value, e.g., `{property: '*'}`, or partial matching to find intentions with at least the specified qualifier
   *         properties. Partial matching is enabled by appending the _any-more_ entry to the qualifier, as following: `{'*': '*'}`.
   * @return An Observable that, when subscribed, emits the requested intentions.
   *         It never completes and emits continuously when matching intentions are registered or unregistered.
   */
  public lookupIntentions$(filter?: ManifestObjectFilter): Observable<Intention[]> {
    return Beans.get(MessageClient).request$<Intention[]>(ManifestRegistryTopics.LookupIntentions, filter)
      .pipe(mapToBody());
  }

  /**
   * Registers given capability. If the capability has public visibility, other applications can browse the capability and interact with it.
   *
   * @return A Promise that resolves to the identity of the registered capability,
   *         or that rejects if the registration failed.
   */
  public registerCapability<T extends Capability>(capability: T): Promise<string> {
    const register$ = Beans.get(MessageClient).request$<string>(ManifestRegistryTopics.RegisterCapability, capability);
    return lastValueFrom(register$.pipe(mapToBody()));
  }

  /**
   * Unregisters capabilities matching the given filter.
   *
   * <strong>You can only unregister capabilities of your application.</strong>
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
    return new Promise<void>((resolve, reject) => {
      Beans.get(MessageClient).request$<void>(ManifestRegistryTopics.UnregisterCapabilities, filter).subscribe({
        error: reject,
        complete: resolve,
      });
    });
  }

  /**
   * Registers the given intention, allowing the application to interact with public capabilities matching the intention.
   *
   * The intention can match multiple capabilities by using wildcards (such as `*` or `?`) in the qualifier.
   *
   * <strong>This operation requires that the 'Intention Registration API' is enabled for your application.</strong>
   *
   * @return A Promise that resolves to the identity of the registered intention,
   *         or that rejects if the registration failed.
   */
  public registerIntention(intention: Intention): Promise<string> {
    const register$ = Beans.get(MessageClient).request$<string>(ManifestRegistryTopics.RegisterIntention, intention);
    return lastValueFrom(register$.pipe(mapToBody()));
  }

  /**
   * Unregisters intentions matching the given filter.
   *
   * <strong>You can only unregister intentions of your application.</strong>
   * <strong>This operation requires that the 'Intention Registration API' is enabled for your application.</strong>
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
    return new Promise<void>((resolve, reject) => {
      Beans.get(MessageClient).request$<void>(ManifestRegistryTopics.UnregisterIntentions, filter).subscribe({
        error: reject,
        complete: resolve,
      });
    });
  }
}

function mapToApplication(): OperatorFunction<ɵApplication[], Application[]> {
  return mapArray(application => {
    return {
      ...application,
      platformVersion: firstValueFrom(Beans.get(MessageClient).request$<string>(ManifestRegistryTopics.platformVersion(application.symbolicName)).pipe(mapToBody())),
    };
  });
}
