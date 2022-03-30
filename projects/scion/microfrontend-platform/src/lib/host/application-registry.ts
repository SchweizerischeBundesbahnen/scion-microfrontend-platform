/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Application, Manifest} from '../platform.model';
import {Defined} from '@scion/toolkit/util';
import {Urls} from '../url.util';
import {MicrofrontendPlatformConfig} from './microfrontend-platform-config';
import {ManifestRegistry} from './manifest-registry/manifest-registry';
import {Beans} from '@scion/toolkit/bean-manager';
import {Logger} from '../logger';
import {ApplicationConfig} from './application-config';

/**
 * Registry with all registered applications.
 *
 * @ignore
 */
export class ApplicationRegistry {

  private static readonly SYMBOLIC_NAME_REGEXP = /^[a-z0-9-]+$/;

  private readonly _applications = new Map<string, Application>();

  /**
   * Registers the given application.
   *
   * Throws an error if the application's symbolic name is not unique or contains illegal characters.
   */
  public registerApplication(applicationConfig: ApplicationConfig, manifest: Manifest): void {
    Defined.orElseThrow(applicationConfig.symbolicName, () => Error('[ApplicationRegistrationError] Missing symbolic name'));
    Defined.orElseThrow(applicationConfig.manifestUrl, () => Error('[ApplicationRegistrationError] Missing manifest URL'));

    if (!ApplicationRegistry.SYMBOLIC_NAME_REGEXP.test(applicationConfig.symbolicName)) {
      throw Error(`[ApplicationRegistrationError] Symbolic name must be lowercase and contain alphanumeric and dash characters [symbolicName='${applicationConfig.symbolicName}'].`);
    }

    const notUniqueSymbolicName = Array.from(this._applications.values()).some(application => application.symbolicName === applicationConfig.symbolicName);
    if (notUniqueSymbolicName) {
      throw Error(`[ApplicationRegistrationError] Symbolic name must be unique [symbolicName='${applicationConfig.symbolicName}'].`);
    }

    this._applications.set(applicationConfig.symbolicName, {
      symbolicName: applicationConfig.symbolicName,
      name: manifest.name,
      baseUrl: this.computeBaseUrl(applicationConfig, manifest),
      manifestUrl: Urls.newUrl(applicationConfig.manifestUrl, Urls.isAbsoluteUrl(applicationConfig.manifestUrl) ? applicationConfig.manifestUrl : window.origin).toString(),
      manifestLoadTimeout: applicationConfig.manifestLoadTimeout ?? Beans.get(MicrofrontendPlatformConfig).manifestLoadTimeout,
      activatorLoadTimeout: applicationConfig.activatorLoadTimeout ?? Beans.get(MicrofrontendPlatformConfig).activatorLoadTimeout,
      messageOrigin: applicationConfig.messageOrigin ?? Urls.newUrl(this.computeBaseUrl(applicationConfig, manifest)).origin,
      scopeCheckDisabled: Defined.orElse(applicationConfig.scopeCheckDisabled, false),
      intentionCheckDisabled: Defined.orElse(applicationConfig.intentionCheckDisabled, false),
      intentionRegisterApiDisabled: Defined.orElse(applicationConfig.intentionRegisterApiDisabled, true),
    });

    manifest.capabilities?.forEach(capability => {
      try {
        Beans.get(ManifestRegistry).registerCapability(capability, applicationConfig.symbolicName);
      }
      catch (error) {
        Beans.get(Logger).error(`[CapabilityRegisterError] Failed to register capability for application '${applicationConfig.symbolicName}'.`, error);
      }
    });

    manifest.intentions?.forEach(intention => {
      try {
        Beans.get(ManifestRegistry).registerIntention(intention, applicationConfig.symbolicName);
      }
      catch (error) {
        Beans.get(Logger).error(`[IntentionRegisterError] Failed to register intention for application '${applicationConfig.symbolicName}'.`, error);
      }
    });
  }

  public getApplication(symbolicName: string): Application | undefined {
    return this._applications.get(symbolicName);
  }

  public getApplications(): Application[] {
    return Array.from(this._applications.values());
  }

  /**
   * Returns whether or not capability 'scope check' is disabled for the given application.
   */
  public isScopeCheckDisabled(appSymbolicName: string): boolean {
    return Defined.orElseThrow(this._applications.get(appSymbolicName), () => Error(`[NullApplicationError] No application registered under the symbolic name '${appSymbolicName}'.`)).scopeCheckDisabled;
  }

  /**
   * Returns whether or not the 'Intention Registration API' is disabled for the given application.
   */
  public isIntentionRegisterApiDisabled(appSymbolicName: string): boolean {
    return Defined.orElseThrow(this._applications.get(appSymbolicName), () => Error(`[NullApplicationError] No application registered under the symbolic name '${appSymbolicName}'.`)).intentionRegisterApiDisabled;
  }

  /**
   * Returns whether or not 'intention check' is disabled for the given application.
   */
  public isIntentionCheckDisabled(appSymbolicName: string): boolean {
    return Defined.orElseThrow(this._applications.get(appSymbolicName), () => Error(`[NullApplicationError] No application registered under the symbolic name '${appSymbolicName}'.`)).intentionCheckDisabled;
  }

  /**
   * Computes the base URL as following:
   *
   * - if base URL is specified in the manifest, that URL is used (either as an absolute URL, or relative to the origin of 'manifestUrl')
   * - if base URL is not specified in the manifest, the origin from 'manifestUrl' is used as the base URL, or the origin from the current window if the 'manifestUrl' is relative
   * - if base URL has no trailing slash, adds a trailing slash
   */
  private computeBaseUrl(applicationConfig: ApplicationConfig, manifest: Manifest): string {
    const manifestURL = Urls.isAbsoluteUrl(applicationConfig.manifestUrl) ? Urls.newUrl(applicationConfig.manifestUrl) : Urls.newUrl(applicationConfig.manifestUrl, window.origin);

    if (!manifest.baseUrl) {
      return Urls.ensureTrailingSlash(manifestURL.origin);
    }

    if (Urls.isAbsoluteUrl(manifest.baseUrl)) {
      return Urls.ensureTrailingSlash(manifest.baseUrl);
    }
    else {
      return Urls.ensureTrailingSlash(Urls.newUrl(manifest.baseUrl, manifestURL.origin).toString());
    }
  }
}

