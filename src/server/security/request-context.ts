import 'server-only';

import { headers } from 'next/headers';
import { getServerEnv } from '@/lib/env';

/**
 * Request metadata used for rate limiting, session binding and audit records.
 *
 * `x-forwarded-for` is client-controllable unless a trusted proxy overwrites it.
 * On Vercel/Neon deployments the platform sets `x-real-ip` and rewrites XFF, so we
 * prefer `x-real-ip` and otherwise take the LEFTMOST XFF entry only from a request
 * that actually traversed our proxy. Never trust these values for authorization.
 */
export interface RequestContext {
  ipAddress: string;
  userAgent: string;
  requestId: string;
  origin: string | null;
  referer: string | null;
}

const MAX_UA_LENGTH = 512;

export async function getRequestContext(): Promise<RequestContext> {
  const headerList = await headers();

  const realIp = headerList.get('x-real-ip');
  const forwardedFor = headerList.get('x-forwarded-for');
  const firstForwarded = forwardedFor?.split(',')[0]?.trim();

  return {
    ipAddress: normaliseIp(realIp ?? firstForwarded ?? 'unknown'),
    userAgent: (headerList.get('user-agent') ?? 'unknown').slice(0, MAX_UA_LENGTH),
    requestId: headerList.get('x-request-id') ?? crypto.randomUUID(),
    origin: headerList.get('origin'),
    referer: headerList.get('referer'),
  };
}

function normaliseIp(value: string): string {
  const trimmed = value.trim();
  // Reject anything that isn't plausibly an address so a spoofed header can't be
  // used to poison a rate-limit key with unbounded cardinality.
  if (trimmed.length === 0 || trimmed.length > 45 || /[^0-9a-fA-F:.]/.test(trimmed)) return 'unknown';
  return trimmed;
}

/** Origins accepted for CSRF and Server Action checks. */
export function getAllowedOrigins(): string[] {
  const { APP_URL } = getServerEnv();
  return [new URL(APP_URL).origin];
}
