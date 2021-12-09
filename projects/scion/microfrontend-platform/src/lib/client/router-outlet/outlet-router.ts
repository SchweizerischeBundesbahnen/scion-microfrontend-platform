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

/**
 * Allows navigating to a site in a {@link SciRouterOutletElement `<sci-router-outlet>`} element.
 *
 * In SCION Microfrontend Platform, routing means instructing a `<sci-router-outlet>` to display the content of a URL. Routing works
 * across microfrontend and micro application boundaries, allowing the URL of an outlet to be set from anywhere in the application. The
 * web content displayed in an outlet can be any HTML document that has not set the HTTP header 'X-Frame-Options'. Routing is sometimes
 * also referred to as navigating.
 *
 * The router supports multiple outlets in the same application to co-exist. By giving an outlet a name, you can reference it as the
 * routing target. If not naming an outlet, its name defaults to {@link PRIMARY_OUTLET primary}. If multiple outlets have the same name,
 * they all show the same content. If routing in the context of a router outlet, that is inside a microfrontend, and not specifying a
 * routing target, the content of the current outlet is replaced.
 *
 * An outlet does not necessarily have to exist at the time of routing. When adding the outlet to the DOM, the outlet displays the last URL
 * routed for it. When repeating routing for an outlet, its content is replaced.
 *
 * The following code snippet illustrates how to instruct the router outlet named aside to show the content of https://micro-frontends.org.
 *
 * ```ts
 * Beans.get(OutletRouter).navigate('https://micro-frontends.org', {outlet: 'aside'});
 * ```
 * The outlet is defined as follows.
 *
 *  ```html
 * <sci-router-outlet name="aside"></sci-router-outlet>
 * ```
 *
 * #### Relative Navigation
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
 * #### Persistent Navigation
 * Persistent navigation refers to the mechanism for restoring the navigational state after an application reload.
 *
 * The router does not provide an implementation for persistent navigation out-of-the-box, mostly because many persistence strategies are imaginable.
 * For example, the navigational state could be added to the top-level URL, stored in local storage, or persisted in the backend.
 * However, you can easily implement persistent navigation yourself. The router publishes navigations to the topic `sci-router-outlets/:outlet/url`;
 * thus, they can be captured and persisted. When starting the application, you can then replay persisted navigations using the router.
 *
 * #### Named URL Parameters
 * The URL being passed to the router can contain named parameters which the router replaces with values of the provided params object.
 * A named parameter begins with a colon (`:`) and is allowed in path segments, query parameters, matrix parameters and the fragment part,
 * e.g., `product/:id` or `product;id=:id` or `products?id=:id`.
 *
 * Parameter substitution is useful if reading the URL from a capability to display a microfrontend. You can then pass the params of the intent as the params
 * object to replace named path segments with actual values from the intent params.
 *
 * See chapter https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:activator:routing-in-the-activator for an example.
 *
 * #### Unloading Outlet Content
 * To unload an outlet’s content, use null as the URL when routing, as follows:
 *
 * ```ts
 * Beans.get(OutletRouter).navigate(null, {outlet: 'aside'});
 * ```
 *
 * #### Browsing History and Session History
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
   * Navigates to the given URL in the given outlet. If not specifying an outlet, then the navigation refers to the outlet of the current outlet
   * context, if any, or resolves to the {@link PRIMARY_OUTLET primary} outlet otherwise.
   *
   * @param  url - Specifies the URL which to display in the outlet. To clear the outlet's content, use `null` as the URL.
   *         The URL allows the use of navigational symbols and named parameters. A named parameter begins with a colon (`:`)
   *         and is allowed in path segments, query parameters, matrix parameters and the fragment part,
   *         e.g., `product/:id` or `product;id=:id` or `products?id=:id`.
   * @param  options - Controls the navigation.
   * @return a Promise that resolves when navigated.
   */
  public async navigate(url: string | null, options?: NavigationOptions): Promise<void> {
    const outlet = await this.resolveOutlet(options);
    const outletUrlTopic = RouterOutlets.urlTopic(outlet);
    const navigationUrl = this.computeNavigationUrl(url, options);
    const messageClient = options && options.messageClient || Beans.get(MessageClient);

    return messageClient.publish(outletUrlTopic, navigationUrl, {
      retain: true,
      headers: new Map<string, any>().set(PUSH_STATE_TO_SESSION_HISTORY_STACK_MESSAGE_HEADER, options?.pushStateToSessionHistoryStack ?? false),
    });
  }

  private computeNavigationUrl(url: string | null | undefined, options?: NavigationOptions): string {
    if (url === undefined || url === null) { // empty path is a valid url
      return 'about:blank';
    }

    const params = Maps.coerce(options?.params);
    if (params.size) {
      url = this.substituteNamedParameters(url, params);
    }
    if (Urls.isAbsoluteUrl(url)) {
      return url;
    }
    else {
      const relativeTo = options?.relativeTo ?? window.location.href;
      return Beans.get(RelativePathResolver).resolve(url, {relativeTo});
    }
  }

  private async resolveOutlet(options?: NavigationOptions): Promise<string> {
    const outlet = options?.outlet;
    if (outlet) {
      return outlet;
    }

    // If no outlet is specified, navigate in the current outlet, if any.
    const outletContext = await Beans.get(ContextService).lookup<OutletContext>(OUTLET_CONTEXT);
    if (outletContext) {
      return outletContext.name;
    }

    // Otherwise, navigate in the primary outlet.
    return PRIMARY_OUTLET;
  }

  /**
   * Replaces named parameters in the given path with values contained in the given {@link Map}.
   * Named parameters begin with a colon (`:`) and are allowed in path segments, query parameters, matrix parameters
   * and the fragment part.
   *
   * Some examples about the usage of named parameters:
   * /segment/:param1/segment/:param2 // path params
   * /segment/segment;matrixParam1=:param1;matrixParam2=:param2 // matrix params
   * /segment/segment?queryParam1=:param1&queryParam2=:param2 // query params
   */
  private substituteNamedParameters(path: string, params: Map<string, any>): string {
    // A named parameter can be followed by another path segment (`/`), by a query param (`?` or `&`), by a matrix param (`;`)
    // or by the fragment part (`#`).
    return path.replace(/:([^/;&?#]+)/g, (match, $1) => params.has($1) ? params.get($1) : match);
  }
}
