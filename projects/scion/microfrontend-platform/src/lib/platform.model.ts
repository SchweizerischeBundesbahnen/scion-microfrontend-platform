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
   * The name of the application, e.g. displayed in the DevTools.
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
   * Maximum time (in milliseconds) that the host waits for this application to fetch its manifest.
   *
   * This is the effective timeout, i.e, either the application-specific timeout as defined in {@link ApplicationConfig.manifestLoadTimeout},
   * or the global timeout as defined in {@link PlatformConfig.manifestLoadTimeout}, otherwise `undefined`.
   */
  manifestLoadTimeout?: number;
  /**
   * Maximum time (in milliseconds) that the host waits for this application to signal readiness.
   *
   * This is the effective timeout, i.e, either the application-specific timeout as defined in {@link ApplicationConfig.activatorLoadTimeout},
   * or the global timeout as defined in {@link PlatformConfig.activatorLoadTimeout}, otherwise `undefined`.
   */
  activatorLoadTimeout?: number;
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
   * an abstract description of the capability. It should include enough information to uniquely identify the capability.
   *
   * Intents must exactly match the qualifier of the capability, if any. The capability qualifier allows using wildcards
   * (such as `*` or `?`) to match multiple intents simultaneously.
   *
   * - **Asterisk wildcard character (`*`):**
   *   Intents must contain such a property, but any value is allowed (except `null` or `undefined`). Use it like this: `{property: '*'}`
   * - **Optional wildcard character (?):**\
   *   Intents can contain such a property. Use it like this: `{property: '?'}`.
   */
  qualifier?: Qualifier;
  /**
   * Specifies parameters which the intent issuer must pass along with the intent.
   * Parameters are part of the contract between the intent publisher and the capability provider.
   * They do not affect the intent routing, unlike the qualifier.
   *
   * @deprecated This API will be removed in a future release. Instead, declare parameters via {@link Capability.params} property.
   */
  requiredParams?: string[];
  /**
   * Specifies parameters which the intent issuer optionally can pass along with the intent.
   * Parameters are part of the contract between the intent publisher and the capability provider.
   * They do not affect the intent routing, unlike the qualifier.
   *
   * @deprecated This API will be removed in a future release. Instead, declare parameters via {@link Capability.params} property.
   */
  optionalParams?: string[];
  /**
   * Specifies parameters which the intent issuer can/must pass along with the intent.
   *
   * Parameters are part of the contract between the intent publisher and the capability provider.
   * They do not affect the intent routing, unlike the qualifier.
   */
  params?: ParamDefinition[];
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
   *
   * The intention must exactly match the qualifier of the capability, if any. The intention qualifier allows using
   * wildcards (such as `*` or `?`) to match multiple capabilities simultaneously.
   *
   * In the intention, the following wildcards are supported:
   * - **Asterisk wildcard character (`*`):**\
   *   Matches capabilities with such a qualifier property no matter of its value (except `null` or `undefined`).
   *   Use it like this: `{property: '*'}`.
   * - **Optional wildcard character (?):**\
   *   Matches capabilities regardless of having or not having such a property. Use it like this: `{property: '?'}`.
   * - **Partial wildcard (`**`):**
   *   Matches capabilities even if having additional properties. Use it like this: `{'*': '*'}`.
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
 * #### Sharing State
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
    /**
     * Starting an activator may take some time. In order not to miss any messages or intents, you can instruct the platform host to
     * wait to enter started state until you signal the activator to be ready. For this purpose, you can define a set of topics where
     * to publish a ready message to signal readiness. If you specify multiple topics, the activator enters ready state after you have
     * published a ready message to all these topics. A ready message is an event; thus, a message without payload.
     *
     * If not specifying a readiness topic, the platform host does not wait for this activator to become ready. However, if you specify a
     * readiness topic, make sure that your activator has a fast startup time and signals readiness as early as possible not to delay
     * the startup of the platform host.
     */
    readinessTopics?: string | string[];
  };
}

/**
 * Describes a parameter to be passed along with an intent.
 */
export interface ParamDefinition {
  /**
   * Specifies the name of the parameter.
   */
  name: string;
  /**
   * Describes the parameter and its usage in more detail.
   */
  description?: string;
  /**
   * Specifies whether the parameter must be passed along with the intent.
   */
  required: boolean;
  /**
   * Allows deprecating the parameter.
   *
   * It is good practice to explain the deprecation, provide the date of removal, and how to migrate.
   * If renaming the parameter, you can set the {@link ParamDefinition.deprecated.useInstead useInstead} property to specify
   * which parameter to use instead. At runtime, this will map the parameter to the specified replacement, allowing for
   * straightforward migration on the provider side.
   */
  deprecated?: true | { message?: string; useInstead?: string; };
  /**
   * Allows the declaration of additional metadata that can be interpreted in an interceptor, for example.
   */
  [property: string]: any;
}
