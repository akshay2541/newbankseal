import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Append-only audit trail for security-sensitive actions.
 *
 * Rows are never updated or deleted by application code — grant the app role
 * INSERT/SELECT only on this table in production. `metadata` must contain no
 * secrets; the write path runs it through the logger's redactor first.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Null for anonymous or system-originated events (e.g. a failed login for an unknown email). */
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorRole: varchar('actor_role', { length: 32 }),

    action: varchar('action', { length: 64 }).notNull(),
    /** 'success' | 'failure' — kept as text so new outcomes don't need a migration. */
    outcome: varchar('outcome', { length: 16 }).notNull().default('success'),

    entityType: varchar('entity_type', { length: 64 }),
    entityId: varchar('entity_id', { length: 64 }),

    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 512 }),
    requestId: varchar('request_id', { length: 64 }),

    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_actor_created_idx').on(table.actorUserId, table.createdAt.desc()),
    index('audit_logs_action_created_idx').on(table.action, table.createdAt.desc()),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_at_idx').on(table.createdAt.desc()),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

/**
 * Durable rate-limit counters.
 *
 * Used when no Redis is configured. `key` is a hashed composite of scope + identifier
 * so raw IPs and emails are not stored in plaintext.
 */
export const rateLimitCounters = pgTable(
  'rate_limit_counters',
  {
    key: varchar('key', { length: 128 }).primaryKey(),
    count: varchar('count', { length: 16 }).notNull().default('0'),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('rate_limit_expires_idx').on(table.expiresAt)],
);
