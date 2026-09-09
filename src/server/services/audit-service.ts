import 'server-only';

import { db } from '@/db/client';
import { auditLogs } from '@/db/schema';
import { logger } from '@/lib/logger';
import type { RequestContext } from '@/server/security/request-context';

/**
 * Audit trail for security-sensitive actions.
 *
 * Every authentication event, role change, publish and administrative mutation writes
 * a row here. Writes are best-effort by design: an audit failure must never break the
 * user-facing operation, but it is escalated to the error log so it can be alerted on.
 */

export type AuditAction =
  | 'auth.register'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_blocked'
  | 'auth.account_locked'
  | 'auth.password_changed'
  | 'auth.sessions_revoked'
  | 'security.csrf_rejected'
  | 'security.rate_limited'
  | 'listing.created'
  | 'listing.updated'
  | 'listing.published'
  | 'listing.deleted'
  | 'enquiry.created'
  | 'user.role_changed'
  | 'user.suspended';

export interface AuditEntry {
  action: AuditAction;
  outcome?: 'success' | 'failure';
  actorUserId?: string | null;
  actorRole?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  context?: Pick<RequestContext, 'ipAddress' | 'userAgent' | 'requestId'>;
}

/** Keys that must never reach the audit table even if a caller passes them. */
const FORBIDDEN_METADATA_KEYS = new Set(['password', 'passwordHash', 'token', 'sessionToken', 'secret', 'otp']);

function sanitiseMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: entry.action,
      outcome: entry.outcome ?? 'success',
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole ?? null,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      ipAddress: entry.context?.ipAddress ?? null,
      userAgent: entry.context?.userAgent?.slice(0, 512) ?? null,
      requestId: entry.context?.requestId ?? null,
      metadata: sanitiseMetadata(entry.metadata) ?? null,
    });
  } catch (error) {
    logger.error('audit.write_failed', { action: entry.action, error });
  }
}
