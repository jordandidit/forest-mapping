/**
 * Vite DEV proxy prefix for Enterprise Portal REST.
 * Used only by explicit fetch() calls (WebMap item JSON) — do NOT rewrite
 * IdentityManager / Portal SDK requests to this host (that triggers sign-in dialogs).
 */
export const DEV_PORTAL_PROXY_PREFIX = '/__rw_portal'
