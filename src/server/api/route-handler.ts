import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError, toPublicError, validationFailed } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';
import { CSRF_HEADER } from '@/lib/csrf-constants';
import { CSRF_COOKIE, verifyCsrf } from '@/server/security/csrf';
import { checkRateLimit, rateLimitHeaders, type RateLimitRule } from '@/server/security/rate-limit';
import { getAllowedOrigins, getRequestContext, type RequestContext } from '@/server/security/request-context';
import { getCurrentSession } from '@/server/auth/current-user';
import { requirePermission, type Permission } from '@/server/auth/rbac';
import type { SessionContext } from '@/server/auth/session';
import { recordAudit } from '@/server/services/audit-service';

/**
 * The single entry point for every API route.
 *
 * Routing every handler through one wrapper means the security checks are applied by
 * construction rather than by remembering: a new endpoint gets CSRF verification, rate
 * limiting, body-size limits, schema validation, permission checks and safe error
 * serialisation without its author opting in. Forgetting a guard requires actively
 * bypassing this function, which is visible in review.
 *
 * Order matters — the cheapest and most protective checks run first, so an unauthorised
 * or forged request is rejected before it can touch the database.
 */

interface HandlerContext<TBody> {
  request: NextRequest;
  body: TBody;
  session: SessionContext | null;
  requestContext: RequestContext;
}

interface RouteOptions<TSchema extends z.ZodTypeAny | undefined> {
  /** Zod schema for the JSON body. Omit for endpoints that take no body. */
  schema?: TSchema;
  /** Rate-limit rule. Every mutating endpoint should set one. */
  rateLimit?: RateLimitRule;
  /** Permission required to invoke the route. Omit for public endpoints. */
  permission?: Permission;
  /** Skip CSRF verification. Only valid for endpoints that cannot mutate state. */
  skipCsrf?: boolean;
}

/** JSON bodies above this are rejected before parsing. Prevents memory-exhaustion posts. */
const MAX_BODY_BYTES = 64 * 1024;

type Inferred<TSchema> = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : undefined;

export function defineRoute<TSchema extends z.ZodTypeAny | undefined = undefined>(
  options: RouteOptions<TSchema>,
  handler: (context: HandlerContext<Inferred<TSchema>>) => Promise<Response>,
) {
  return async function route(request: NextRequest): Promise<Response> {
    const requestContext = await getRequestContext();

    try {
      // --- 1. CSRF ----------------------------------------------------------
      if (!options.skipCsrf) {
        const { CSRF_SECRET } = getServerEnv();
        const result = await verifyCsrf({
          secret: CSRF_SECRET,
          method: request.method,
          origin: requestContext.origin,
          referer: requestContext.referer,
          allowedOrigins: getAllowedOrigins(),
          cookieToken: request.cookies.get(CSRF_COOKIE)?.value,
          submittedToken: request.headers.get(CSRF_HEADER) ?? undefined,
        });

        if (!result.ok) {
          await recordAudit({
            action: 'security.csrf_rejected',
            outcome: 'failure',
            metadata: { reason: result.reason, path: new URL(request.url).pathname },
            context: requestContext,
          });
          throw new AppError('CSRF_FAILED');
        }
      }

      // --- 2. Rate limit ----------------------------------------------------
      let limitHeaders: Record<string, string> = {};
      if (options.rateLimit) {
        const limit = await checkRateLimit(options.rateLimit, requestContext.ipAddress);
        limitHeaders = rateLimitHeaders(limit);

        if (!limit.allowed) {
          return json({ code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' }, 429, limitHeaders);
        }
      }

      // --- 3. Authorization -------------------------------------------------
      const session = await getCurrentSession();
      if (options.permission) {
        requirePermission(session, options.permission);
      }

      // --- 4. Body -----------------------------------------------------------
      const body = (options.schema ? await parseBody(request, options.schema) : undefined) as Inferred<TSchema>;

      const response = await handler({ request, body, session, requestContext });
      for (const [key, value] of Object.entries(limitHeaders)) response.headers.set(key, value);
      return response;
    } catch (error) {
      return handleError(error, request, requestContext);
    }
  };
}

async function parseBody<TSchema extends z.ZodTypeAny>(
  request: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new AppError('BAD_REQUEST', 'Request body is too large.', { expose: true });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AppError('BAD_REQUEST', 'Expected a JSON request body.', { expose: true });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    // Guard again after reading: content-length is client-supplied and can lie.
    if (text.length > MAX_BODY_BYTES) {
      throw new AppError('BAD_REQUEST', 'Request body is too large.', { expose: true });
    }
    raw = JSON.parse(text);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('BAD_REQUEST', 'Request body is not valid JSON.', { expose: true });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    // Field messages are authored by us in the schemas and are safe to return; they
    // describe the input, never the system.
    throw validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  return parsed.data;
}

function handleError(error: unknown, request: NextRequest, context: RequestContext): Response {
  const { status, body } = toPublicError(error);

  // Unexpected failures are logged in full server-side; the client sees only a
  // generic message and the request id it can quote to support.
  if (status >= 500) {
    logger.error('api.unhandled_error', {
      path: new URL(request.url).pathname,
      method: request.method,
      requestId: context.requestId,
      error,
    });
  } else {
    logger.info('api.request_rejected', {
      path: new URL(request.url).pathname,
      code: body.code,
      requestId: context.requestId,
    });
  }

  return json(body, status, { 'x-request-id': context.requestId });
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return NextResponse.json(body, {
    status,
    headers: {
      // API responses are per-user by definition; never let a shared cache hold one.
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}
