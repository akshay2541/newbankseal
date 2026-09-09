/**
 * CSRF wire format constants, shared by client and server.
 *
 * Kept out of `@/server/**` so client code can import the names without pulling a
 * server module into the browser bundle.
 */
export const CSRF_COOKIE = 'bs.csrf';
export const CSRF_HEADER = 'x-csrf-token';
export const CSRF_FORM_FIELD = 'csrfToken';
