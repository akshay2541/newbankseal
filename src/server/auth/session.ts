import 'server-only';

import { and, eq, gt, isNull, lt, ne, or } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { sessions, users, type User } from '@/db/schema';
import { isProduction } from '@/lib/env';
import { randomToken, sha256Hex } from '@/server/security/crypto';

/**
 * Opaque, server-side sessions.
 *
 * Design decisions and why:
 *  - The cookie holds a 256-bit random token; the database stores only its SHA-256.
 *    A dump of `sessions` therefore yields nothing an attacker can present.
 *  - Two expiries: a rolling idle timeout (refreshed on use) and a hard absolute cap,
 *    so a continuously active session still cannot live forever.
 *  - `__Host-` prefix in production pins the cookie to the exact origin with Path=/
 *    and Secure, which blocks subdomain cookie-injection attacks.
 *  - The token is rotated on privilege changes via `rotateSession` to prevent fixation.
 */

export const SESSION_COOKIE = isProduction ? '__Host-bs.session' : 'bs.session';

const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ABSOLUTE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** Only write back `lastUsedAt`/`expiresAt` when the session is this stale — avoids a write per request. */
const REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export interface SessionContext {
  sessionId: string;
  user: Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'emailVerifiedAt'>;
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: isProduction,
    // Lax keeps the cookie on top-level navigations (so email links work) while
    // withholding it from cross-site POSTs. CSRF tokens cover the remaining gap.
    sameSite: 'lax' as const,
    path: '/',
    expires,
  };
}

/** Create a session and set the cookie. Returns the session id for audit logging. */
export async function createSession(userId: string, context: { ipAddress: string; userAgent: string }) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  const expiresAt = new Date(now + IDLE_TIMEOUT_MS);
  const absoluteExpiresAt = new Date(now + ABSOLUTE_TIMEOUT_MS);

  const [created] = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent.slice(0, 512),
      expiresAt,
      absoluteExpiresAt,
    })
    .returning({ id: sessions.id });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(expiresAt));

  return { sessionId: created?.id ?? null, expiresAt };
}

/**
 * Resolve the current session.
 *
 * Returns null for every failure mode — missing cookie, unknown token, revoked,
 * expired, or a user who is no longer active. Callers must not distinguish these.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const now = new Date();

  const rows = await db
    .select({
      sessionId: sessions.id,
      lastUsedAt: sessions.lastUsedAt,
      absoluteExpiresAt: sessions.absoluteExpiresAt,
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        gt(sessions.absoluteExpiresAt, now),
        isNull(users.deletedAt),
        eq(users.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Rolling refresh, rate-limited so a busy user doesn't cause a write per request.
  if (now.getTime() - row.lastUsedAt.getTime() > REFRESH_THRESHOLD_MS) {
    const nextExpiry = new Date(Math.min(now.getTime() + IDLE_TIMEOUT_MS, row.absoluteExpiresAt.getTime()));
    await db
      .update(sessions)
      .set({ lastUsedAt: now, expiresAt: nextExpiry })
      .where(eq(sessions.id, row.sessionId));
  }

  return {
    sessionId: row.sessionId,
    user: {
      id: row.userId,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
      status: row.status,
      emailVerifiedAt: row.emailVerifiedAt,
    },
  };
}

/** Revoke the caller's session and clear the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = await sha256Hex(token);
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, tokenHash));
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Revoke every session for a user. Called on password change, role change and
 * administrative suspension so a compromised credential cannot outlive the response.
 */
export async function revokeAllSessions(userId: string, options?: { exceptSessionId?: string }): Promise<void> {
  const conditions = [eq(sessions.userId, userId), isNull(sessions.revokedAt)];
  if (options?.exceptSessionId) {
    conditions.push(ne(sessions.id, options.exceptSessionId));
  }

  await db.update(sessions).set({ revokedAt: new Date() }).where(and(...conditions));
}

/** Housekeeping: drop rows that can no longer authenticate anyone. */
export async function purgeExpiredSessions(): Promise<void> {
  const now = new Date();
  await db.delete(sessions).where(or(lt(sessions.expiresAt, now), lt(sessions.absoluteExpiresAt, now)));
}
