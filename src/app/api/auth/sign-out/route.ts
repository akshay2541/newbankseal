import { defineRoute, json } from '@/server/api/route-handler';
import { getCurrentSession } from '@/server/auth/current-user';
import { destroySession } from '@/server/auth/session';
import { recordAudit } from '@/server/services/audit-service';

/**
 * Sign out.
 *
 * A POST, not a GET: a sign-out reachable by navigation could be triggered from any
 * page that embeds an image pointing at it. CSRF verification still applies.
 *
 * Always returns 204, whether or not a session was found — an unauthenticated caller
 * learns nothing, and a client retrying after a network blip gets the same answer.
 */
export const POST = defineRoute({}, async ({ requestContext }) => {
  const session = await getCurrentSession();

  await destroySession();

  if (session) {
    await recordAudit({
      action: 'auth.logout',
      actorUserId: session.user.id,
      actorRole: session.user.role,
      entityType: 'session',
      entityId: session.sessionId,
      context: requestContext,
    });
  }

  return json(null, 204);
});

export const dynamic = 'force-dynamic';
