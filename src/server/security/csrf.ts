import { hmacSign, hmacVerify, randomToken } from './crypto';

/**
 * Signed double-submit CSRF tokens.
 *
 * The cookie holds `<random>.<hmac(random)>`; the client echoes the same value in the
 * `x-csrf-token` header. An attacker on another origin can neither read the cookie
 * (SameSite=Lax + no CORS credentials) nor forge the signature without CSRF_SECRET.
 *
 * The cookie is deliberately NOT httpOnly — the app's own script must read it to set
 * the header. It carries no authority on its own; the session cookie is httpOnly.
 */
export { CSRF_COOKIE, CSRF_HEADER, CSRF_FORM_FIELD } from '@/lib/csrf-constants';

/** Methods that cannot change state and therefore need no token. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

export async function issueCsrfToken(secret: string): Promise<string> {
  const value = randomToken(32);
  const signature = await hmacSign(secret, value);
  return `${value}.${signature}`;
}

export async function isValidCsrfToken(secret: string, token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const value = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!value || !signature) return false;

  return hmacVerify(secret, value, signature);
}

/**
 * Full CSRF check for a state-changing request.
 *
 * Three independent conditions must all hold:
 *  1. the `Origin` (or `Referer`) matches an allowed origin — blocks classic cross-site posts;
 *  2. a validly signed token is present in the cookie;
 *  3. the submitted token matches the cookie exactly.
 */
export async function verifyCsrf(params: {
  secret: string;
  method: string;
  origin: string | null;
  referer: string | null;
  allowedOrigins: string[];
  cookieToken: string | undefined;
  submittedToken: string | undefined;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { secret, method, origin, referer, allowedOrigins, cookieToken, submittedToken } = params;

  if (isSafeMethod(method)) return { ok: true };

  const claimedOrigin = origin ?? (referer ? safeOrigin(referer) : null);
  if (!claimedOrigin) return { ok: false, reason: 'missing_origin' };
  if (!allowedOrigins.includes(claimedOrigin)) return { ok: false, reason: 'origin_mismatch' };

  if (!cookieToken || !submittedToken) return { ok: false, reason: 'missing_token' };
  if (cookieToken !== submittedToken) return { ok: false, reason: 'token_mismatch' };
  if (!(await isValidCsrfToken(secret, cookieToken))) return { ok: false, reason: 'bad_signature' };

  return { ok: true };
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
