'use client';

import { CSRF_COOKIE, CSRF_HEADER } from '@/lib/csrf-constants';

/**
 * Reads the CSRF cookie so the browser can echo it back in a header.
 *
 * This is the "double submit" half of the defence and is intentionally readable by
 * our own script. It grants no authority on its own — the session cookie is httpOnly
 * and the token is HMAC-signed server-side, so a value invented by an attacker fails
 * verification even if they can set a cookie.
 */
export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  for (const part of document.cookie.split('; ')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator) === CSRF_COOKIE) {
      return decodeURIComponent(part.slice(separator + 1));
    }
  }
  return null;
}

/**
 * `fetch` wrapper for same-origin mutations. Always attaches the CSRF header and
 * never sends credentials cross-origin.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');

  const token = readCsrfToken();
  if (token) headers.set(CSRF_HEADER, token);

  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'same-origin',
    // Never let a mutation be served from cache.
    cache: 'no-store',
  });
}
