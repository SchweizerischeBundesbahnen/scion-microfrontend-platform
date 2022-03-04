/**
 * Specifies the interval (in milliseconds) at which connected clients must send a heartbeat to indicate connectivity to the host.
 *
 * By default, if not set, a heartbeat interval of 60s is used.
 */
export const CLIENT_HEARTBEAT_INTERVAL = Symbol('CLIENT_HEARTBEAT_INTERVAL');

/**
 * Specifies the delay (in milliseconds) for unregistering a stale client.
 *
 * By default, if not set, stale clients are unregistered after 2 seconds.
 */
export const STALE_CLIENT_UNREGISTER_DELAY = Symbol('STALE_CLIENT_UNREGISTER_DELAY');
