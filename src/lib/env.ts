import { z } from 'zod';

/**
 * Fail-fast environment validation.
 *
 * Split into two schemas so that a client bundle can never pull in a server secret:
 * `serverEnv` is guarded by a runtime check and must only be imported from server code,
 * while `clientEnv` contains exclusively NEXT_PUBLIC_* values.
 */

const nonEmpty = (name: string) => z.string().min(1, `${name} must be set`);

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /**
   * Optional in the schema, required in practice.
   *
   * It is not `nonEmpty` here because this schema is parsed as a whole by every
   * subsystem: making one variable mandatory for all of them meant a missing database
   * URL also disabled CSRF and sessions, taking down API routes that never touch
   * Postgres. The requirement is enforced instead by the production refinement below
   * and by `getDatabaseUrl()`, so a real deployment still fails loudly.
   */
  DATABASE_URL: z.string().url().optional(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),

  APP_URL: nonEmpty('APP_URL').url(),

  // 32 bytes of entropy minimum. Base64 of 32 bytes is 44 chars.
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),

  RATE_LIMIT_REDIS_URL: z.string().url().optional().or(z.literal('')),
  RATE_LIMIT_REDIS_TOKEN: z.string().optional(),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let cachedServerEnv: ServerEnv | null = null;

/**
 * Parse and cache the server environment. Throws on first access if misconfigured,
 * which surfaces the problem at boot rather than at the first request that needs it.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() was called in the browser. This is a server-only module.');
  }
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema
    .superRefine((env, ctx) => {
      // A serving production process must have a database. During `next build` there
      // is nothing to connect to yet, so that phase is exempt.
      const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
      if (env.NODE_ENV === 'production' && !isBuildPhase && !env.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production',
        });
      }
    })
    .safeParse(process.env);

  if (!parsed.success) {
    // Print the failing keys only — never the values, which are secrets.
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid server environment configuration:\n${issues}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const isProduction = process.env.NODE_ENV === 'production';

/**
 * The database connection string, or a clear failure.
 *
 * Separated from `getServerEnv()` so the database's requirements stay the database's:
 * callers that need Postgres get an actionable error, and callers that don't are
 * unaffected by its absence.
 */
export function getDatabaseUrl(): string {
  const url = getServerEnv().DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not configured. Copy .env.example to .env.local and add your Neon connection string, then run `npm run db:push && npm run db:seed`.',
    );
  }
  return url;
}
