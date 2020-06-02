/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/**
 * Manifest of an application.
 *
 * The manifest is a special file that contains information about a micro application. A micro application declares
 * its intentions and capabilities in its manifest file. The manifest needs to be registered in the host application.
 *
 * @category Platform
 */
export interface ApplicationManifest {
  /**
   * The name of the application, e.g. displayed in the Developer Tools.
   */
  name: string;
  /**
   * URL to the application root. The URL can be fully qualified, or a path relative to the origin under
   * which serving the manifest file. If not specified, the origin of the manifest file acts as the base
   * URL. The platform uses the base URL to resolve microfrontends such as activator endpoints.
   * For a Single Page Application that uses hash-based routing, you typically specify the hash symbol (`#`)
   * as the base URL.
   */
  baseUrl?: string;
  /**
   * Functionality which this application intends to use.
   */
  intentions?: Intention[];
  /**
   * Functionality which this application provides that qualified apps can call via intent.
   */
  capabilities?: Capability[];
}

/**
 * Represents a dictionary of key-value pairs to qualify an intention, intent or capability.
 *
 * See {@link Intention}, {@link Capability} or {@link Intent} for the usage of wildcards
 * in qualifier properties.
 *
 * @category Platform
 */
export interface Qualifier {
  [key: string]: string | number | boolean;
}

/**
 * Qualifies nothing.
 *
 * @category Platform
 */
export const NilQualifier = {};

/**
 * Qualifies anything.
 *
 * @category Platform
 */
export const AnyQualifier = {'*': '*'};

/**
 * Represents an application registered in the platform.
 *
 * @category Platform
 */
export interface Application {
  /**
   * Unique symbolic name of the application.
   */
  symbolicName: string;
  /**
   * Name of the application as specified in the manifest.
   */
  name: string;
  /**
   * URL to the application root.
   */
  baseUrl: string;
  /**
   * Origin of the application.
   */
  origin: string;
  /**
   * URL to the manifest of this application.
   */
  manifestUrl: string;
  /**
   * Indicates whether or not capability scope check is disabled for this application.
   */
  scopeCheckDisabled: boolean;
  /**
   * Indicates whether or not this application can issue intents for which it has not declared a respective intention.
   */
  intentionCheckDisabled: boolean;
  /**
   * Indicates whether or not 'Intention Registration API' is disabled for this application.
   */
  intentionRegisterApiDisabled: boolean;
}

/**
 * A micro application can provide functionality to micro applications by declaring a capability in its manifest.
 *
 * Micro applications can then look up the capability, or invoke it via intent. When a micro application invokes the capability, the platform transports the
 * intent to the providing micro application. A capability is formulated in an abstract way, having assigned a type, and optionally a qualifier. This information
 * is required for interacting with the capability, i.e., for formulating the intent. Think of it as a form of capability addressing. The type categorizes a
 * capability in terms of its functional semantics (e.g., microfrontend if providing a microfrontend). It can be an arbitrary `string` literal and has no meaning
 * to the platform. Multiple capabilities can be of the same type; thus, a capability may also define a qualifier to differentiate the different capabilities.
 * A qualifier is a dictionary of arbitrary key-value pairs.
 *
 * Arbitrary metadata can be associated with a capability. A capability can have private or public visibility. If private, the capability is not visible to other
 * micro applications.
 *
 * @category Platform
 */
export interface Capability {
  /**
   * Categorizes the capability in terms of its functional semantics (e.g., `microfrontend` if providing a microfrontend).
   */
  type: string;
  /**
   * The qualifier is a dictionary of arbitrary key-value pairs to differentiate capabilities of the same `type` and is like
   * an abstract description of the capability. It should include enough information for the platform to uniquely resolve
   * the capability.
   *
   * The qualifier allows using wildcards (such as `*` or `?`) to match multiple intents simultaneously.
   *
   * - **Asterisk wildcard character (`*`):**
   *   - If used as qualifier property key, matches intents even if having additional properties. Use it like this: `{'*': '*'}`.
   *   - If used as qualifier property value, requires intents to contain that property, but with any value allowed (except for `null` or `undefined` values).
   * - **Optional wildcard character (?):**\
   *   Is allowed as qualifier property value only and matches intents regardless of having or not having that property.
   */
  qualifier?: Qualifier;
  /**
   * Controls if this capability is visible to other micro applications. If private, which is by default, the capability is not visible
   * to other micro applications; thus, it can only be invoked or looked up by the providing micro application.
   */
  private?: boolean;
  /**
   * A short description to explain the capability.
   */
  description?: string;
  /**
   * Arbitrary metadata to be associated with the capability.
   */
  properties?: {
    [key: string]: any;
  };
  /**
   * Metadata about the capability (read-only, exclusively managed by the platform).
   * @ignore
   */
  metadata?: {
    /**
     * Unique identity of this capability.
     */
    id: string;
    /**
     * Symbolic name of the application which provides this capability.
     */
    appSymbolicName: string;
  };
}

/**
 * A micro application must declare an intention in its manifest when using functionality provided via a capability.
 *
 * Interacting with a capability requires the declaration of an intention in the manifest of the micro application. The enforced declaration
 * allows analyzing which micro applications depend on each other and to see, which capability is used by which micro application.
 *
 * An intention is formulated in an abstract way, having assigned a type, and optionally a qualifier. The qualifier of an intention allows using
 * wildcards (such as * or ?) to match multiple capabilities simultaneously.
 *
 * @category Platform
 */
export interface Intention {
  /**
   * The type of capability to interact with.
   */
  type: string;
  /**
   * Qualifies the capability which to interact with.
   *
   * The qualifier is a dictionary of arbitrary key-value pairs to differentiate capabilities of the same `type`.
   * It can be either exact or contain wildcards to declare multiple intentions simultaneously.
   *
   * - **Asterisk wildcard character (`*`):**
   *   - If used as qualifier property key, matches capabilities even if having additional properties. Use it like this: `{'*': '*'}`.
   *   - If used as qualifier property value, requires capabilities to contain that property, but with any value allowed (except for `null` or `undefined` values).
   * - **Optional wildcard character (?):**\
   *   Is allowed as qualifier property value only and matches capabilities regardless of having or not having that property.
   */
  qualifier?: Qualifier;
  /**
   * Metadata about this intention (read-only, exclusively managed by the platform).
   * @ignore
   */
  metadata?: {
    /**
     * Unique identity of this intent declaration.
     */
    id: string;
    /**
     * Symbolic name of the application which declares this intention.
     */
    appSymbolicName: string;
  };
}

/**
 * Symbol to determine if this app instance is running as the platform host.
 *
 * ```ts
 * const isPlatformHost: boolean = Beans.get(IS_PLATFORM_HOST);
 * ```
 *
 * @category Platform
 */
export abstract class IS_PLATFORM_HOST { // tslint:disable-line:class-name
}

/**
 * Built in capability types.
 *
 * @ignore
 */
export enum PlatformCapabilityTypes {
  /**
   * Classifier to register an activator capability.
   *
   * @see Activator
   */
  Activator = 'activator'
}

/**
 * An activator allows a micro application to initialize and connect to the platform when the user loads the host
 * application into his browser.
 *
 * In the broadest sense, an activator is a kind of microfrontend, i.e. an HTML page that runs in an iframe. In contrast
 * to regular microfrontends, however, at platform startup, the platform loads activator microfrontends into hidden iframes
 * for the entire platform lifecycle, thus, providing a stateful session to the micro application on the client-side.
 *
 * Some typical use cases for activators are receiving messages and intents, preloading data, or flexibly providing capabilities.
 *
 * A micro application registers an activator as public _activator_ capability in its manifest, as follows:
 *
 * ```json
 * "capabilities": [
 *   {
 *     "type": "activator",
 *     "private": false,
 *     "properties": {
 *       "path": "path/to/the/activator"
 *     }
 *   }
 * ]
 * ```
 *
 * #### Activation Context
 * An activator's microfrontend runs inside an activation context. The context provides access
 * to the activator capability, allowing to read properties declared on the activator capability.
 *
 * You can obtain the activation context using the {@link ContextService} as following.
 *
 * ```ts
 * // Looks up the activation context.
 * const ctx: ActivationContext = await Beans.get(ContextService).lookup(ACTIVATION_CONTEXT);
 * ```
 *
 * #### Multiple Activators
 * A micro application can register multiple activators. Note, that each activator boots the micro
 * application on its own and runs in a separate browsing context. The platform nominates one activator
 * of each micro application as its primary activator. The nomination has no relevance to the platform but
 * can help code decide whether or not to install singleton functionality.
 *
 * You can test if running in the primary activation context as following.
 * ```ts
 * // Looks up the activation context.
 * const ctx = await Beans.get(ContextService).lookup<ActivationContext>(ACTIVATION_CONTEXT);
 * // Checks if running in the context of the primary activator.
 * const isPrimary: boolean = ctx.primary;
 * ```
 *
 *  #### Sharing State
 * Since an activator runs in a separate browsing context, microfrontends cannot directly access its state.
 * Instead, an activator could put data, for example, into session storage, so that microfrontends of its micro
 * application can access it. Alternatively, an activator could install a message listener, allowing microfrontends
 * to request data via client-side messaging.
 *
 * @category Platform
 */
export interface Activator extends Capability {
  type: PlatformCapabilityTypes.Activator;
  private: false;
  properties: {
    /**
     * Path where the platform can load the activator microfrontend. The path is relative to the base URL
     * of the micro application, as specified in the application manifest.
     */
    path: string;
  };
}
