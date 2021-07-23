/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Activator, PlatformCapabilityTypes} from '../../platform.model';
import {PlatformManifestService} from '../../client/manifest-registry/platform-manifest-service';
import {catchError, filter, mergeMapTo, take} from 'rxjs/operators';
import {ApplicationRegistry} from '../application-registry';
import {OutletRouter} from '../../client/router-outlet/outlet-router';
import {SciRouterOutletElement} from '../../client/router-outlet/router-outlet.element';
import {Arrays, Maps} from '@scion/toolkit/util';
import {UUID} from '@scion/toolkit/uuid';
import {Logger} from '../../logger';
import {PlatformMessageClient} from '../platform-message-client';
import {MessageHeaders} from '../../messaging.model';
import {EMPTY} from 'rxjs';
import {PlatformState} from '../../platform-state';
import {Beans, Initializer} from '@scion/toolkit/bean-manager';
import {PlatformStateRef} from '../../platform-state-ref';
import {ProgressMonitor} from '../progress-monitor/progress-monitor';
import {ActivatorLoadProgressMonitor} from '../progress-monitor/progress-monitors';
import {timeoutIfPresent} from '../../operators';

/**
 * Activates micro applications which provide an activator capability.
 *
 * Activators enable micro applications to interact with the platform for the entire platform lifecycle.
 * Activators can signal when ready for operation, causing this initializer to wait until received respective readiness messages.
 *
 * @ignore
 */
export class ActivatorInstaller implements Initializer {

  public async init(): Promise<void> {
    // Lookup activators.
    const activators: Activator[] = await Beans.get(PlatformManifestService).lookupCapabilities$<Activator>({type: PlatformCapabilityTypes.Activator})
      .pipe(take(1))
      .toPromise();

    const monitor = Beans.get(ActivatorLoadProgressMonitor);
    if (!activators.length) {
      monitor.done();
      return;
    }

    // Group activators by their providing application.
    const activatorsGroupedByApp: Map<string, Activator[]> = activators
      .filter(this.skipInvalidActivators())
      .reduce((grouped, activator) => Maps.addListValue(grouped, activator.metadata!.appSymbolicName, activator), new Map<string, Activator[]>());

    // Create Promises that wait for activators to signal ready.
    const subMonitors = monitor.splitEven(activatorsGroupedByApp.size);
    const activatorReadyPromises: Promise<void>[] = Array
      .from(activatorsGroupedByApp.entries())
      .reduce((acc, [appSymbolicName, appActivators], index) => {
        return acc.concat(this.waitForActivatorsToSignalReady(appSymbolicName, appActivators, subMonitors[index]));
      }, [] as Promise<void>[]);

    // Mount activators in hidden iframes
    activatorsGroupedByApp.forEach((sameAppActivators: Activator[]) => {
      // Nominate one activator of each app as primary activator.
      const primaryActivator = sameAppActivators[0];
      sameAppActivators.forEach(activator => this.mountActivator(activator, activator === primaryActivator));
    });

    // Wait until activators signal ready.
    await Promise.all(activatorReadyPromises);
  }

  private skipInvalidActivators(): (activator: Activator) => boolean {
    return (activator: Activator): boolean => {
      if (!activator.properties || !activator.properties.path) {
        Beans.get(Logger).error(`[ActivatorError] Failed to activate the application '${activator.metadata!.appSymbolicName}'. Missing required 'path' property in the provided activator capability.`, activator);
        return false;
      }
      return true;
    };
  }

  /**
   * Creates a Promise that resolves when given activators signal ready.
   */
  private async waitForActivatorsToSignalReady(appSymbolicName: string, activators: Activator[], monitor: ProgressMonitor): Promise<void> {
    const t0 = Date.now();
    const activatorLoadTimeout = Beans.get(ApplicationRegistry).getApplication(appSymbolicName)!.activatorLoadTimeout;
    const readinessPromises: Promise<void>[] = activators
      .reduce((acc, activator) => acc.concat(Arrays.coerce(activator.properties.readinessTopics)), new Array<string>()) // concat readiness topics
      .map(readinessTopic => Beans.get(PlatformMessageClient).observe$<void>(readinessTopic)
        .pipe(
          filter(msg => msg.headers.get(MessageHeaders.AppSymbolicName) === appSymbolicName),
          timeoutIfPresent(activatorLoadTimeout),
          take(1),
          mergeMapTo(EMPTY),
          catchError(error => {
            Beans.get(Logger).error(`[ActivatorLoadTimeoutError] Timeout elapsed while waiting for application to signal readiness [app=${appSymbolicName}, timeout=${activatorLoadTimeout}ms, readinessTopic=${readinessTopic}].`, error);
            return EMPTY;
          }),
        )
        .toPromise(),
      );

    if (!readinessPromises.length) {
      monitor.done();
      return Promise.resolve();
    }

    await Promise.all(readinessPromises);
    monitor.done();
    Beans.get(Logger).info(`Activator startup of '${appSymbolicName}' took ${Date.now() - t0}ms.`);
  }

  /**
   * Mounts a hidden <sci-router-outlet> and loads the activator endpoint.
   */
  private mountActivator(activator: Activator, primary: boolean): void {
    const application = Beans.get(ApplicationRegistry).getApplication(activator.metadata!.appSymbolicName)!;

    // Create the router outlet and navigate to the activator endpoint.
    const routerOutlet = document.createElement('sci-router-outlet') as SciRouterOutletElement;
    routerOutlet.name = UUID.randomUUID();
    Beans.get(OutletRouter).navigate(activator.properties.path, {
      outlet: routerOutlet.name,
      relativeTo: application.baseUrl,
    }).then();

    // Provide the activation context
    routerOutlet.setContextValue<ActivationContext>(ACTIVATION_CONTEXT, {primary, activator});
    // Add CSS classes for debugging purposes
    routerOutlet.classList.add('sci-activator', application.symbolicName);
    // Make the router outlet invisible
    routerOutlet.style.display = 'none';
    // Take the router outlet out of the document flow
    routerOutlet.style.position = 'absolute';
    // Add the router outlet to the DOM
    document.body.appendChild(routerOutlet);
    // Unmount the router outlet on platform shutdown
    Beans.get(PlatformStateRef).whenState(PlatformState.Stopped).then(() => document.body.removeChild(routerOutlet));
  }
}

/**
 * Key for obtaining the current activation context using {@link ContextService}.
 *
 * The activation context is only available to microfrontends loaded by an activator.
 *
 * @see {@link ActivationContext}
 * @see {@link ContextService}
 * @category Platform
 */
export const ACTIVATION_CONTEXT = 'ɵACTIVATION_CONTEXT';

/**
 * Information about the activator that loaded a microfrontend.
 *
 * This context is available to a microfrontend if loaded by an application activator.
 * This object can be obtained from the {@link ContextService} using the name {@link ACTIVATION_CONTEXT}.
 *
 * ```ts
 * const ctx = await Beans.get(ContextService).lookup<ActivationContext>(ACTIVATION_CONTEXT);
 * ```
 *
 * @see {@link ACTIVATION_CONTEXT}
 * @see {@link ContextService}
 * @category Platform
 */
export interface ActivationContext {
  /**
   * Indicates whether running in the context of the primary activator.
   * The platform nominates one activator of each app as primary activator.
   */
  primary: boolean;
  /**
   * Metadata about the activator that activated the microfrontend.
   */
  activator: Activator;
}
