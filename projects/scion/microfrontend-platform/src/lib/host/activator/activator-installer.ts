/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ACTIVATION_CONTEXT, ActivationContext, ActivatorCapability, PlatformCapabilityTypes} from '../../platform.model';
import {first} from 'rxjs/operators';
import {ApplicationRegistry} from '../application-registry';
import {OutletRouter} from '../../client/router-outlet/outlet-router';
import {SciRouterOutletElement} from '../../client/router-outlet/router-outlet.element';
import {Arrays, Maps} from '@scion/toolkit/util';
import {UUID} from '@scion/toolkit/uuid';
import {Logger} from '../../logger';
import {MessageHeaders} from '../../messaging.model';
import {EMPTY, firstValueFrom, identity, Observable, timeout} from 'rxjs';
import {PlatformState} from '../../platform-state';
import {Beans, Initializer} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {ProgressMonitor} from '../progress-monitor/progress-monitor';
import {ActivatorLoadProgressMonitor} from '../progress-monitor/progress-monitors';
import {ManifestService} from '../../client/manifest-registry/manifest-service';
import {MessageClient} from '../../client/messaging/message-client';

/**
 * Activates micro applications which provide an activator capability.
 *
 * Activators enable micro applications to interact with the platform for the entire platform lifecycle.
 * Activators can signal when ready for operation, causing this initializer to wait until received respective readiness messages.
 *
 * @internal
 */
export class ActivatorInstaller implements Initializer {

  public async init(): Promise<void> {
    // Lookup activators.
    const activators: ActivatorCapability[] = await firstValueFrom(Beans.get(ManifestService).lookupCapabilities$<ActivatorCapability>({type: PlatformCapabilityTypes.Activator}));

    const monitor = Beans.get(ActivatorLoadProgressMonitor);
    if (!activators.length) {
      monitor.done();
      return;
    }

    // Group activators by their providing application.
    const activatorsGroupedByApp: Map<string, ActivatorCapability[]> = activators
      .filter(this.skipInvalidActivators())
      .reduce((grouped, activator) => Maps.addListValue(grouped, activator.metadata!.appSymbolicName, activator), new Map<string, ActivatorCapability[]>());

    // Create Promises that wait for activators to signal ready.
    const subMonitors = monitor.splitEven(activatorsGroupedByApp.size);
    const activatorReadyPromises: Promise<void>[] = Array
      .from(activatorsGroupedByApp.entries())
      .reduce((acc, [appSymbolicName, appActivators], index) => {
        return acc.concat(this.waitForActivatorsToSignalReady(appSymbolicName, appActivators, subMonitors[index]));
      }, [] as Promise<void>[]);

    // Mount activators in hidden iframes
    activatorsGroupedByApp.forEach((sameAppActivators: ActivatorCapability[]) => {
      // Nominate one activator of each app as primary activator.
      const primaryActivator = sameAppActivators[0];
      sameAppActivators.forEach(activator => this.mountActivator(activator, activator === primaryActivator));
    });

    // Wait until activators signal ready.
    await Promise.all(activatorReadyPromises);
  }

  private skipInvalidActivators(): (activator: ActivatorCapability) => boolean {
    return (activator: ActivatorCapability): boolean => {
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
  private async waitForActivatorsToSignalReady(appSymbolicName: string, activators: ActivatorCapability[], monitor: ProgressMonitor): Promise<void> {
    const t0 = Date.now();
    const activatorLoadTimeout = Beans.get(ApplicationRegistry).getApplication(appSymbolicName).activatorLoadTimeout;
    const readinessPromises: Promise<void>[] = activators
      .reduce((acc, activator) => acc.concat(Arrays.coerce(activator.properties.readinessTopics)), new Array<string>()) // concat readiness topics
      .map(readinessTopic => {
          const onReadinessTimeout = (): Observable<never> => {
            Beans.get(Logger).error(`[ActivatorLoadTimeoutError] Timeout elapsed while waiting for application to signal readiness [app=${appSymbolicName}, timeout=${activatorLoadTimeout}ms, readinessTopic=${readinessTopic}].`);
            return EMPTY;
          };
          return new Promise((resolve, reject) => {
            return Beans.get(MessageClient).observe$<void>(readinessTopic)
              .pipe(
                first(msg => msg.headers.get(MessageHeaders.AppSymbolicName) === appSymbolicName),
                activatorLoadTimeout ? timeout({first: activatorLoadTimeout, with: onReadinessTimeout}) : identity,
              )
              .subscribe({
                error: reject,
                complete: resolve,
              });
          });
        },
      );

    if (!readinessPromises.length) {
      monitor.done();
      return;
    }

    await Promise.all(readinessPromises);
    monitor.done();
    Beans.get(Logger).info(`Activator startup of '${appSymbolicName}' took ${Date.now() - t0}ms.`);
  }

  /**
   * Mounts a hidden <sci-router-outlet> and loads the activator endpoint.
   */
  private mountActivator(activator: ActivatorCapability, primary: boolean): void {
    const application = Beans.get(ApplicationRegistry).getApplication(activator.metadata!.appSymbolicName);

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
    routerOutlet.classList.add('sci-activator');
    // Add custom data attribute with the application's symbolic name for debugging purposes
    routerOutlet.dataset['app'] = application.symbolicName;
    // Make the router outlet invisible
    routerOutlet.style.display = 'none';
    // Take the router outlet out of the document flow
    routerOutlet.style.position = 'absolute';
    // Add the router outlet to the DOM
    document.body.appendChild(routerOutlet);
    // Unmount the router outlet on platform shutdown
    MicrofrontendPlatform.whenState(PlatformState.Stopped).then(() => document.body.removeChild(routerOutlet));
  }
}
