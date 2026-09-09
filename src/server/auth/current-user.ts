import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { unauthenticated } from '@/lib/errors';
import { getSessionContext, type SessionContext } from './session';
import { hasPermission, type Permission } from './rbac';

/**
 * Per-request memoised session lookup.
 *
 * `cache()` dedupes the query across every Server Component in a single render, so a
 * layout, a page and three nested components share one database round-trip.
 */
export const getCurrentSession = cache(async (): Promise<SessionContext | null> => getSessionContext());

/** For route handlers and Server Actions: throw rather than redirect. */
export async function requireSession(): Promise<SessionContext> {
  const session = await getCurrentSession();
  if (!session) throw unauthenticated();
  return session;
}

/** For pages: send the visitor to sign-in, preserving where they were headed. */
export async function requireSessionOrRedirect(returnTo: string): Promise<SessionContext> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

/** Non-throwing check, for conditionally rendering UI affordances. */
export async function can(permission: Permission): Promise<boolean> {
  const session = await getCurrentSession();
  return session ? hasPermission(session.user.role, permission) : false;
}
