import { Dictionary } from '@scion/toolkit/util';
import { MessageClient } from '../messaging/message-client';

/**
 * Options to control outlet navigation.
 *
 * @category Routing
 */
export interface NavigationOptions {
  /**
   * Specifies the routing target. If not specifying an outlet, then the navigation refers to the outlet of the current
   * outlet context, if any, or to the {@link PRIMARY_OUTLET primary} outlet otherwise.
   */
  outlet?: string;
  /**
   * Specifies the base URL to resolve a relative url. If not specified, the current window location is used to resolve a relative path.
   */
  relativeTo?: string;
  /**
   * Specifies parameters which will be used for the substitution of named URL parameters.
   */
  params?: Map<string, any> | Dictionary;
  /**
   * Instructs the router to push a state to the browser's session history stack, allowing the user to use the back button to navigate back in the outlet.
   * By default, this behavior is disabled.
   */
  pushStateToSessionHistoryStack?: boolean;
  /**
   * @internal
   */
  messageClient?: MessageClient;
}

/**
 * Routing message header to control if to push a state to the browser's session history stack.
 *
 * @ignore
 */
export const PUSH_STATE_TO_SESSION_HISTORY_STACK_MESSAGE_HEADER = 'ɵPUSH_STATE_TO_SESSION_HISTORY_STACK';

/**
 * Represents a navigation.
 */
export interface Navigation {
  /**
   * The URL where to navigate to.
   */
  url: string;
  /**
   * If `true`, adds a state to the browser's session history stack.
   */
  pushStateToSessionHistoryStack: boolean;
}
