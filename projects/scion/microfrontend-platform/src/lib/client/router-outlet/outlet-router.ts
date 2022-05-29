/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MessageClient} from '../messaging/message-client';
import {OUTLET_CONTEXT, OutletContext, PRIMARY_OUTLET, RouterOutlets} from './router-outlet.element';
import {ContextService} from '../context/context-service';
import {Urls} from '../../url.util';
import {RelativePathResolver} from './relative-path-resolver';
import {Maps} from '@scion/toolkit/util';
import {NavigationOptions, PUSH_STATE_TO_SESSION_HISTORY_STACK_MESSAGE_HEADER} from './metadata';
import {Beans} from '@scion/toolkit/bean-manager';
import {Intent, mapToBody, RequestError} from '../../messaging.model';
import {lastValueFrom} from 'rxjs';
import {IntentClient} from '../messaging/intent-client';
import {ACTIVATION_CONTEXT, PlatformCapabilityTypes, Qualifier} from '../../platform.model';

/**
 * Allows navigating to a web page or microfrontend in a {@link SciRouterOutletElement `<sci-router-outlet>`} element.
 *
 * In SCION Microfrontend Platform, routing means instructing a `<sci-router-outlet>` to display the content of a URL. Routing works
 * across microfrontend and micro application boundaries, allowing the URL of an outlet to be set from anywhere in the application. The
 * web content displayed in an outlet can be any HTML document that has not set the HTTP header X-Frame-Options. Routing is also referred
 * to as navigating.
 *
 * The router supports multiple outlets in the same application to co-exist. By giving an outlet a name, you can reference it as the
 * routing target. If not naming an outlet, its name defaults to {@link PRIMARY_OUTLET primary}. If multiple outlets have the same name,
 * they all show the same content. If routing in the context of a router outlet, that is inside a microfrontend, and not specifying a
 * routing target, the content of the current outlet is replaced.
 *
 * An outlet does not necessarily have to exist at the time of routing. When adding the outlet to the DOM, the outlet displays the last URL
 * routed for it. When repeating routing for an outlet, its content is replaced.
 *
 * A router outlet is defined as follows. If no navigation has been performed for the outlet yet, then its content is empty.
 *
 *  ```html
 * <sci-router-outlet name="aside"></sci-router-outlet>
 * ```
 *
 * ### Navigation via URL
 * The URL of the page to be loaded into the router outlet is passed to the router, as follows:
 *
 * ```ts
 * Beans.get(OutletRouter).navigate('https://micro-frontends.org', {outlet: 'aside'});
 * ```
 *
 * #### Relative URL Navigation
 * The router allows to use both absolute and relative paths. A relative path begins with a navigational symbol `/`, `./`, or `../`. By default,
 * relative navigation is relative to the current window location of the navigating application, unless specifying a base path for the navigation.
 *
 * ```ts
 * // Navigation relative to the root path segment
 * Beans.get(OutletRouter).navigate('/products/:id', {outlet: PRIMARY_OUTLET});
 *
 * // Navigation relative to the parent path segment
 * Beans.get(OutletRouter).navigate('../products/:id', {outlet: PRIMARY_OUTLET});
 * ```
 *
 * #### Named URL Parameters
 * The URL being passed to the router can contain named parameters which the router replaces with values of the provided params object.
 * A named parameter begins with a colon (`:`) and is allowed in path segments, query parameters, matrix parameters and the fragment part,
 * e.g., `product/:id` or `product;id=:id` or `products?id=:id`.
 *
 * ### Navigating via Intent
 * As an alternative to navigating directly to a URL, the router supports navigation to a microfrontend capability via an intent.
 * We refer to this as intent-based routing.
 *
 * We recommend using intent-based routing over url-based routing, especially for cross-application navigations, since the navigation flows
 * are explicit, i.e., declared in the manifest, and to keep the microfrontend URLs an implementation detail of the micro applications that
 * provide the microfrontends.
 *
 * Note that if the microfrontend is provided by another micro app, the navigating app must manifest an intention. Also, the navigating
 * app can only navigate to public microfrontend capabilities.
 *
 * The following code snippet illustrates how to display the _product_ microfrontend in the "aside" outlet. Note that you only need to pass
 * the qualifier of the microfrontend capability and not its type. The capability type, which is always `microfrontend`, is implicitly set
 * by the router.
 *
 * ```ts
 * Beans.get(OutletRouter).navigate({entity: 'product'}, {
 *   outlet: 'aside',
 *   params: {id: 123},
 * });
 * ````
 *
 * Applications can provide microfrontend capabilities through their manifest. A microfrontend can be either application private or exposed to
 * other micro applications. The platform requires all microfrontend capabilities to be of type `microfrontend`. A particular microfrontend can
 * be identified using its qualifier.
 *
 * ```json
 * {
 *   "type": "microfrontend",
 *   "qualifier": {
 *     "entity": "product"
 *   },
 *   "description": "Displays a product.",
 *   "params": [
 *     {"name": "id", "required": true}
 *   ],
 *   "private": false,
 *   "properties": {
 *     "path": "product/:id",
 *   }
 * }
 * ```
 *
 * Note that the providing micro application does not need to install an intent handler for its microfrontend capabilities. The platform intercepts
 * microfrontend intents and performs the navigation.
 *
 * ### Persistent Navigation
 * Persistent navigation refers to the mechanism for restoring the navigational state after an application reload.
 *
 * The router does not provide an implementation for persistent navigation out-of-the-box, mostly because many persistence strategies are imaginable.
 * For example, the navigational state could be added to the top-level URL, stored in local storage, or persisted in the backend.
 * However, you can easily implement persistent navigation yourself. The router publishes navigations to the topic `sci-router-outlets/:outlet/url`;
 * thus, they can be captured and persisted. When starting the application, you can then replay persisted navigations using the router.
 *
 * ### Unloading Outlet Content
 * To unload an outlet’s content, use null as the URL when routing, as follows:
 *
 * ```ts
 * Beans.get(OutletRouter).navigate(null, {outlet: 'aside'});
 * ```
 *
 * ### Browsing History and Session History
 * Routing does not add an entry to the browsing history, and, by default, not push a navigational state to the browser’s session history stack.
 *
 * You can instruct the router to add a navigational state to the browser’s session history stack, allowing the user to use the back button of the browser to
 * navigate back in an outlet.
 *
 * ```ts
 * Beans.get(OutletRouter).navigate('https://micro-frontends.org', {
 *   outlet: 'aside',
 *   pushStateToSessionHistoryStack: true,
 * });
 * ```
 *
 * @see {@link SciRouterOutletElement}
 *
 * @category Routing
 */
export class OutletRouter {

  /**
   * Navigates to the passed URL.
   *
   * If not specifying an outlet and if navigating in the context of an outlet, that outlet will be used as the navigation target,
   * or the {@link PRIMARY_OUTLET primary} outlet otherwise.
   *
   * @param  url - Specifies the URL of the page to be loaded into the router outlet. To clear the outlet, pass `null` as the URL.
   *         The URL allows the use of navigational symbols and named parameters. A named parameter begins with a colon (`:`)
   *         and is allowed in path segments, query parameters, matrix parameters and the fragment part. Named parameters
   *         are replaced with values passed via {@link NavigationOptions#params}. Named query and matrix parameters without
   *         a replacement are removed.
   *         Examples:
   *         - `product/:id` // named path parameter
   *         - `product;id=:id` // named matrix parameter
   *         - `products?id=:id` // named query parameter
   * @param  options - Instructs the router how to navigate, for example, you can specify the router outlet or pass named parameter values for substitution.
   * @return Promise that resolves when navigated, or that rejects otherwise.
   */
  public navigate(url: string | null, options?: NavigationOptions): Promise<void>;
  /**
   * Navigates to the microfrontend provided as {@link MicrofrontendCapability} matching the passed qualifier.
   *
   * We recommend using intent-based routing over url-based routing, especially for cross-application navigations, since the navigation flows are
   * explicit, i.e., declared in the manifest, and to keep the microfrontend URLs an implementation detail of the micro applications that provide
   * the microfrontends.
   *
   * If the microfrontend is provided by another micro app, the navigating app must manifest an intention. Also, the navigating app can only navigate
   * to public microfrontend capabilities.
   *
   * If not specifying an outlet and if navigating in the context of an outlet, that outlet will be used as the navigation target,
   * or the {@link PRIMARY_OUTLET primary} outlet otherwise.
   *
   * @param  qualifier - Qualifies the microfrontend which to load into the outlet.
   * @param  options - Instructs the router how to navigate, for example, you can specify the router outlet or pass intent parameters.
   * @return Promise that resolves when navigated, or that rejects otherwise.
   */
  public navigate(qualifier: Qualifier, options?: NavigationOptions): Promise<void>;

  public async navigate(target: string | Qualifier | null, options?: NavigationOptions): Promise<void> {
    if (!target || typeof target === 'string') {
      await this.navigateByUrl(target as string, options);
    }
    else {
      await this.navigateByIntent(target, options);
    }
  }

  /**
   * Navigates to specified URL.
   */
  private async navigateByUrl(url: string | null, options?: NavigationOptions): Promise<void> {
    const outlet = options?.outlet || await this.resolveContextualOutlet() || PRIMARY_OUTLET;
    const outletUrlTopic = RouterOutlets.urlTopic(outlet);
    const navigationUrl = this.computeNavigationUrl(url, options);

    return Beans.get(MessageClient).publish(outletUrlTopic, navigationUrl, {
      retain: true,
      headers: new Map<string, any>().set(PUSH_STATE_TO_SESSION_HISTORY_STACK_MESSAGE_HEADER, options?.pushStateToSessionHistoryStack ?? false),
    });
  }

  /**
   * Navigates to a microfrontend available as {@link MicrofrontendCapability} matching the passed qualifier.
   */
  private async navigateByIntent(qualifier: Qualifier, options?: NavigationOptions): Promise<void> {
    if (options?.relativeTo) {
      throw Error('[OutletRouterError][UnsupportedOptionError] Unsupported navigation option "relativeTo". This option is not supported in intent-based routing.');
    }

    const contextualOutlet = await this.resolveContextualOutlet();
    const intent: Intent = {type: PlatformCapabilityTypes.Microfrontend, qualifier, params: Maps.coerce(options?.params)};
    const navigate$ = Beans.get(IntentClient).request$<void>(intent, options, {headers: new Map().set(ROUTING_CONTEXT_MESSAGE_HEADER, {[ROUTING_CONTEXT_OUTLET]: contextualOutlet})});
    try {
      await lastValueFrom(navigate$.pipe(mapToBody()));
    }
    catch (error) {
      throw (error instanceof RequestError ? error.message : error);
    }
  }

  private computeNavigationUrl(urlPattern: string | null | undefined, options?: NavigationOptions): string {
    if (urlPattern === undefined || urlPattern === null) { // empty path is a valid url
      return 'about:blank';
    }

    const params = Maps.coerce(options?.params);
    const url = this.substituteNamedParameters(urlPattern, params);
    if (Urls.isAbsoluteUrl(url)) {
      return url;
    }
    else {
      const relativeTo = options?.relativeTo ?? window.location.href;
      return Beans.get(RelativePathResolver).resolve(url, {relativeTo});
    }
  }

  private async resolveContextualOutlet(): Promise<string | undefined> {
    // If navigating in the context of an activator, do not use that outlet as contextual outlet.
    if (await Beans.get(ContextService).isPresent(ACTIVATION_CONTEXT)) {
      return undefined;
    }
    return (await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT))?.name;
  }

  /**
   * Replaces named parameters in the given path with values contained in the given {@link Map}.
   * Named parameters begin with a colon (`:`) and are allowed in path segments, query parameters, matrix parameters
   * and the fragment part.
   *
   * Empty query and matrix params are removed, but not empty path params.
   *
   * Some examples about the usage of named parameters:
   * /segment/:param1/segment/:param2 // path params
   * /segment/segment;matrixParam1=:param1;matrixParam2=:param2 // matrix params
   * /segment/segment?queryParam1=:param1&queryParam2=:param2 // query params
   */
  private substituteNamedParameters(path: string, params: Map<string, any>): string {
    return path
      // 1. Replace named params contained in the params map.
      .replace(/:([^/;&?#]+)/g, (match, paramName) => params.get(paramName) !== undefined ? params.get(paramName) : match)
      // 2. Remove named matrix params not contained in the params map.
      .replace(/(?<delimiter>;)(?<paramName>[^=]+)=:(?<placeholder>[^;#?/]+)/g, () => {
        return '';
      })
      // 3. Remove named query params not contained in the params map. Replaces the first query param
      //    with a special marker for later substitution.
      .replace(/(?<delimiter>[?&])(?<paramName>[^=]+)=:(?<placeholder>[^&#]+)/g, (match, delimiter) => {
        return (delimiter === '?') ? 'ɵ__?__' : '';
      })
      // 4. Replace the marker with the question mark if at least one query parameter is present.
      .replace(/ɵ__\?__&/, '?')
      // 5. Remove marker if no query params are present.
      .replace(/ɵ__\?__/, '');
  }
}

/**
 * Message header with information about the current context of the navigator.
 * @internal
 */
export const ROUTING_CONTEXT_MESSAGE_HEADER = 'context';

/**
 * Name of the current outlet if navigating in the context of an outlet.
 * @internal
 */
export const ROUTING_CONTEXT_OUTLET = 'outlet';
