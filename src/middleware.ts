import { NextResponse, type NextRequest } from 'next/server';
import { CSRF_COOKIE } from '@/lib/csrf-constants';
import { isSafeMethod } from '@/server/security/csrf';
import { hmacSign, randomToken } from '@/server/security/crypto';

/**
 * Edge middleware. Runs before every non-static request.
 *
 * Responsibilities, in order:
 *  1. stamp a request id used to correlate logs and audit rows;
 *  2. reject cross-origin state-changing requests early (cheap, before any DB work);
 *  3. mint a CSRF cookie for sessions that don't have one;
 *  4. emit a nonce-based Content-Security-Policy.
 *
 * Deliberately does NOT do authentication. Middleware cannot reach the database, so a
 * check here could only read an unverified cookie — and a "logged in" decision made on
 * an unverified cookie is exactly the bug class we're avoiding. Authorization happens in
 * Server Components, Server Actions and route handlers via `requirePermission`.
 */

const isProduction = process.env.NODE_ENV === 'production';

function allowedOrigins(): string[] {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return [];
  try {
    return [new URL(appUrl).origin];
  } catch {
    return [];
  }
}

function buildCsp(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    // strict-dynamic lets Next's nonce'd bootstrap load its own chunks; the host
    // allow-list is ignored by browsers that honour strict-dynamic and acts as a
    // fallback for those that don't.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isProduction ? '' : "'unsafe-eval'"}`.trim(),
    // Next injects inline <style> for critical CSS; a nonce is not threaded through
    // those, so 'unsafe-inline' is required for styles specifically. Scripts remain strict.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://images.unsplash.com https://tile.openstreetmap.org`,
    `font-src 'self' data:`,
    `connect-src 'self'${isProduction ? '' : ' ws: http://localhost:*'}`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ];

  return directives.join('; ');
}

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const nonce = randomToken(16);

  // --- 2. Cross-origin guard -------------------------------------------------
  if (!isSafeMethod(request.method)) {
    const origin = request.headers.get('origin');
    const permitted = allowedOrigins();

    // A same-origin fetch always sends Origin for non-safe methods. A missing Origin
    // on a mutation is either an old client or a forgery attempt — fail closed.
    if (!origin || (permitted.length > 0 && !permitted.includes(origin))) {
      return new NextResponse(
        JSON.stringify({ code: 'CSRF_FAILED', message: 'Your session could not be verified.' }),
        { status: 403, headers: { 'content-type': 'application/json', 'x-request-id': requestId } },
      );
    }
  }

  // Propagate context to the Node.js runtime via request headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // --- 3. CSRF cookie --------------------------------------------------------
  if (!request.cookies.has(CSRF_COOKIE)) {
    const secret = process.env.CSRF_SECRET;
    if (secret && secret.length >= 32) {
      const value = randomToken(32);
      const token = `${value}.${await hmacSign(secret, value)}`;
      response.cookies.set(CSRF_COOKIE, token, {
        // Readable by our own script so it can populate the x-csrf-token header.
        // Carries no authority by itself.
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      });
    }
  }

  // --- 4. Content-Security-Policy -------------------------------------------
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: [
    /**
     * Everything except Next's static output, image optimiser and common static files.
     * Those are immutable assets with no session or CSRF surface.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
