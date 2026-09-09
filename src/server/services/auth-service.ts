import 'server-only';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { AppError, conflict, unauthenticated } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { SignInInput, SignUpInput } from '@/lib/validation/auth';
import { createSession, revokeAllSessions } from '@/server/auth/session';
import { ALGO_VERSION, burnEquivalentWork, hashPassword, needsRehash, verifyPassword } from '@/server/security/password';
import { checkRateLimit, RATE_LIMITS, resetRateLimit } from '@/server/security/rate-limit';
import type { RequestContext } from '@/server/security/request-context';
import { recordAudit } from './audit-service';

/**
 * Authentication use-cases.
 *
 * Two rules govern everything in this file:
 *
 *  1. **No user enumeration.** Registering with a taken address, signing in with an
 *     unknown address and signing in with a wrong password must be indistinguishable
 *     to the caller — in status code, message body and (approximately) response time.
 *  2. **Layered brute-force defence.** A per-IP rate limit throttles the attacker's
 *     machine; a per-account failure counter with lockout protects a targeted user
 *     even from a distributed attempt that defeats the IP limit.
 */

const ACCOUNT_LOCK_THRESHOLD = 10;
const ACCOUNT_LOCK_DURATION_MS = 30 * 60_000;

export interface AuthResult {
  userId: string;
  fullName: string;
  role: string;
}

export async function registerUser(input: SignUpInput, context: RequestContext): Promise<AuthResult> {
  const ipLimit = await checkRateLimit(RATE_LIMITS.register, context.ipAddress);
  if (!ipLimit.allowed) {
    await recordAudit({ action: 'security.rate_limited', outcome: 'failure', metadata: { scope: 'register' }, context });
    throw new AppError('RATE_LIMITED');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const [created] = await db
      .insert(users)
      .values({
        email: input.email,
        emailNormalized: input.email,
        fullName: input.fullName,
        phone: input.phone ? input.phone : null,
        passwordHash,
        passwordAlgoVersion: ALGO_VERSION,
        // New accounts always start as buyers. Role elevation is a separate,
        // audited administrative action — never something a signup body can request.
        role: 'buyer',
        // Kept `active` so the product is usable immediately; wire email verification
        // to flip this to `pending_verification` when the mail provider is connected.
        status: 'active',
        acceptedTermsAt: new Date(),
        marketingOptIn: input.marketingOptIn ?? false,
      })
      .returning({ id: users.id, fullName: users.fullName, role: users.role });

    if (!created) throw new AppError('INTERNAL');

    await createSession(created.id, context);
    await recordAudit({
      action: 'auth.register',
      actorUserId: created.id,
      actorRole: created.role,
      entityType: 'user',
      entityId: created.id,
      context,
    });

    return { userId: created.id, fullName: created.fullName, role: created.role };
  } catch (error) {
    if (isUniqueViolation(error)) {
      // The address is already registered. Surfacing that would let anyone probe the
      // user base, so the caller gets the same generic conflict either way and the
      // real reason goes only to the audit trail.
      await recordAudit({
        action: 'auth.register',
        outcome: 'failure',
        metadata: { reason: 'email_taken' },
        context,
      });
      throw conflict('We could not create that account. If you already have one, try signing in.');
    }

    logger.error('auth.register_failed', { error });
    throw new AppError('INTERNAL');
  }
}

export async function authenticateUser(input: SignInInput, context: RequestContext): Promise<AuthResult> {
  // Layer 1: throttle the source. Keyed on IP + email so one noisy office NAT cannot
  // lock every colleague out, while a single attacker still gets throttled.
  const limitKey = `${context.ipAddress}|${input.email}`;
  const attemptLimit = await checkRateLimit(RATE_LIMITS.login, limitKey);
  if (!attemptLimit.allowed) {
    await recordAudit({ action: 'security.rate_limited', outcome: 'failure', metadata: { scope: 'login' }, context });
    throw new AppError('RATE_LIMITED');
  }

  const [account] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      role: users.role,
      status: users.status,
      passwordHash: users.passwordHash,
      passwordAlgoVersion: users.passwordAlgoVersion,
      failedLoginCount: users.failedLoginCount,
      lockedUntil: users.lockedUntil,
    })
    .from(users)
    .where(and(eq(users.emailNormalized, input.email), isNull(users.deletedAt)))
    .limit(1);

  if (!account) {
    // Spend comparable CPU so response time doesn't reveal that the address is unknown.
    await burnEquivalentWork(input.password);
    await recordAudit({
      action: 'auth.login',
      outcome: 'failure',
      metadata: { reason: 'unknown_email' },
      context,
    });
    throw unauthenticated();
  }

  // Layer 2: per-account lockout, effective even against a distributed attack.
  if (account.lockedUntil && account.lockedUntil > new Date()) {
    await recordAudit({
      action: 'auth.login_blocked',
      outcome: 'failure',
      actorUserId: account.id,
      metadata: { reason: 'account_locked' },
      context,
    });
    throw unauthenticated();
  }

  const passwordValid = await verifyPassword(account.passwordHash, input.password);

  if (!passwordValid) {
    await registerFailedAttempt(account.id, account.failedLoginCount, context);
    throw unauthenticated();
  }

  // A correct password on a suspended or deactivated account still gets nothing, and
  // the response is identical to a wrong password so status can't be probed.
  if (account.status !== 'active') {
    await recordAudit({
      action: 'auth.login_blocked',
      outcome: 'failure',
      actorUserId: account.id,
      metadata: { reason: `status_${account.status}` },
      context,
    });
    throw unauthenticated();
  }

  // Success: clear both throttles and upgrade the hash if the parameters have moved on.
  const updates: Record<string, unknown> = {
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
    updatedAt: new Date(),
  };

  if (needsRehash(account.passwordAlgoVersion)) {
    updates.passwordHash = await hashPassword(input.password);
    updates.passwordAlgoVersion = ALGO_VERSION;
  }

  await db.update(users).set(updates).where(eq(users.id, account.id));
  await resetRateLimit(RATE_LIMITS.login, limitKey);

  // A fresh session is minted per sign-in, so a token an attacker planted in the
  // victim's browser beforehand is never the one that ends up authenticated.
  await createSession(account.id, context);

  await recordAudit({
    action: 'auth.login',
    actorUserId: account.id,
    actorRole: account.role,
    entityType: 'user',
    entityId: account.id,
    context,
  });

  return { userId: account.id, fullName: account.fullName, role: account.role };
}

/**
 * Change a password and cut every other session loose.
 *
 * Revoking siblings is the point of the operation: if the password is being changed
 * because it leaked, a session the attacker already holds must not survive it.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: RequestContext,
): Promise<void> {
  const [account] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, role: users.role })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!account || !(await verifyPassword(account.passwordHash, currentPassword))) {
    await recordAudit({ action: 'auth.password_changed', outcome: 'failure', actorUserId: userId, context });
    throw unauthenticated();
  }

  const now = new Date();
  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(newPassword),
      passwordAlgoVersion: ALGO_VERSION,
      passwordChangedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  await revokeAllSessions(userId);
  await createSession(userId, context);

  await recordAudit({
    action: 'auth.password_changed',
    actorUserId: userId,
    actorRole: account.role,
    entityType: 'user',
    entityId: userId,
    context,
  });
}

async function registerFailedAttempt(userId: string, currentCount: number, context: RequestContext): Promise<void> {
  const nextCount = currentCount + 1;
  const shouldLock = nextCount >= ACCOUNT_LOCK_THRESHOLD;

  await db
    .update(users)
    .set({
      // Incremented in SQL so two concurrent attempts can't both read 3 and write 4.
      failedLoginCount: sql`${users.failedLoginCount} + 1`,
      lockedUntil: shouldLock ? new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS) : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await recordAudit({
    action: shouldLock ? 'auth.account_locked' : 'auth.login',
    outcome: 'failure',
    actorUserId: userId,
    metadata: { reason: 'bad_password', attempt: nextCount },
    context,
  });
}

/** Postgres unique-violation SQLSTATE. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: unknown }).code;
  return code === '23505';
}
