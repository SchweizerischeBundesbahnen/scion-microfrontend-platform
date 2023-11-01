import {Dictionary} from '@scion/toolkit/util';

/**
 * Options to control outlet navigation.
 *
 * @category Routing
 */
export interface NavigationOptions {
  /**
   * Specifies the routing target. If not specifying an outlet and if navigating in the context of an outlet, that outlet will be used as the
   * navigation target, or the {@link PRIMARY_OUTLET primary} outlet otherwise.
   */
  outlet?: string;
  /**
   * Instructs the router outlet to show a splash, such as a skeleton or loading indicator, until the microfrontend signals readiness.
   * The splash is the markup between the opening and closing tags of the router outlet element.
   *
   * This flag is ignored when navigating by intent as specified by the microfrontend capability in {@link MicrofrontendCapability.properties.showSplash}.
   *
   * @see SciRouterOutletElement
   * @see MicrofrontendPlatformClient.signalReady
   */
  showSplash?: boolean;
  /**
   * Specifies the base URL to resolve a relative url. If not specified, the current window location is used to resolve a relative path.
   *
   * Note that this property has no effect if navigating via intent.
   */
  relativeTo?: string;
  /**
   * Specifies the parameters that, if navigating via URL, are used to substitute named URL parameters or that are passed along with the intent
   * if navigating via intent.
   */
  params?: Map<string, any> | Dictionary;
  /**
   * Instructs the router to push a state to the browser's session history stack, allowing the user to use the back button to navigate back in the outlet.
   * By default, this behavior is disabled.
   */
  pushStateToSessionHistoryStack?: boolean;
  /**
   * Reference to the microfrontend capability when navigating via intent.
   * Internal property used by the router outlet to determine if to ignore the `showSplash` instruction when navigating to the same microfrontend capability again.
   * @ignore
   */
  ɵcapabilityId?: string;
}

/**
 * Routing message header to control if to push a state to the browser's session history stack.
 *
 * @internal
 */
export const PUSH_STATE_TO_SESSION_HISTORY_STACK_MESSAGE_HEADER = 'ɵPUSH_STATE_TO_SESSION_HISTORY_STACK';

/**
 * Routing message header to control if to show a splash until the microfrontend signals readiness.
 *
 * @internal
 */
export const SHOW_SPLASH_MESSAGE_HEADER = 'ɵSHOW_SPLASH';

/**
 * Routing message header that contains the microfrontend capability when navigating via intent.
 *
 * @internal
 */
export const CAPABILITY_ID_MESSAGE_HEADER = 'ɵCAPABILITY_ID';

/**
 * Represents a navigation.
 *
 * @category Routing
 */
export interface Navigation {
  /**
   * The URL where to navigate to.
   */
  url: string;
  /**
   * If `true`, adds a state to the browser's session history stack.
   */
  pushStateToSessionHistoryStack?: boolean;
  /**
   * If `true`, instructs the router outlet to show a splash, such as a skeleton or loading indicator,
   * until the microfrontend signals readiness.
   *
   * @see SciRouterOutletElement
   * @see MicrofrontendPlatformClient.signalReady
   */
  showSplash?: boolean;
  /**
   * The microfrontend capability when navigating via intent.
   */
  capabilityId?: string;
}
