import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { userRoleEnum, userStatusEnum } from './enums';

/**
 * Identity table.
 *
 * `passwordHash` holds an Argon2id digest — never a reversible value, never returned
 * from a repository that feeds a response. `emailNormalized` is the uniqueness key so
 * that `A@x.com` and `a@x.com` cannot both register.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    email: varchar('email', { length: 320 }).notNull(),
    // Lower-cased, trimmed. Enforced by the service layer and by the unique index below.
    emailNormalized: varchar('email_normalized', { length: 320 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),

    passwordHash: text('password_hash').notNull(),
    // Bumped whenever the hashing parameters change so logins can transparently rehash.
    passwordAlgoVersion: integer('password_algo_version').notNull().default(1),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).notNull().defaultNow(),

    fullName: varchar('full_name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),

    role: userRoleEnum('role').notNull().default('buyer'),
    status: userStatusEnum('status').notNull().default('pending_verification'),

    // Brute-force state. Reset on every successful authentication.
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

    acceptedTermsAt: timestamp('accepted_terms_at', { withTimezone: true }),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_email_normalized_key').on(table.emailNormalized),
    index('users_role_status_idx').on(table.role, table.status),
    index('users_created_at_idx').on(table.createdAt.desc()),
    // Defence in depth: the DB rejects a malformed address even if validation is bypassed.
    check('users_email_format_check', sql`${table.emailNormalized} ~ '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'`),
    check('users_failed_login_count_check', sql`${table.failedLoginCount} >= 0`),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

/**
 * Server-side session store.
 *
 * The cookie carries a random 32-byte token; only its SHA-256 digest is stored here,
 * so a database disclosure does not yield usable session credentials. Sessions are
 * revocable individually or in bulk (password change, admin action).
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    tokenHash: varchar('token_hash', { length: 64 }).notNull(),

    // Bound context — a session presented from a wildly different context is a signal.
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 512 }),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_key').on(table.tokenHash),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

/**
 * Single-use, short-lived tokens for email verification and password reset.
 * Same hash-at-rest treatment as sessions.
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: varchar('purpose', { length: 32 }).notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('verification_tokens_hash_key').on(table.tokenHash),
    index('verification_tokens_user_purpose_idx').on(table.userId, table.purpose),
  ],
);
