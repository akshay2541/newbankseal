import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getDatabaseUrl } from '@/lib/env';
import * as schema from './schema';

/**
 * Neon HTTP driver over Drizzle.
 *
 * `server-only` makes importing this from a client component a build error, so a
 * connection string can never be bundled for the browser.
 *
 * The client is created lazily behind a Proxy. Constructing it at module scope would
 * make an unset `DATABASE_URL` throw during *import* — which no call-site try/catch
 * can recover from, and which would take down surfaces that don't need the database
 * at all. Deferring to first property access means a configuration error surfaces at
 * the query that needs it, where it can be handled.
 *
 * All access goes through Drizzle's query builder or `sql` tagged templates, both of
 * which bind values as parameters — SQL is never assembled by string concatenation.
 */
const createClient = () => drizzle(neon(getDatabaseUrl()), { schema, logger: false });

type Db = ReturnType<typeof createClient>;

const globalForDb = globalThis as unknown as { __bankSealDb?: Db };

function getDb(): Db {
  if (!globalForDb.__bankSealDb) {
    globalForDb.__bankSealDb = createClient();
  }
  return globalForDb.__bankSealDb;
}

export const db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
  has(_target, property) {
    return Reflect.has(getDb(), property);
  },
}) as Db;

export { schema };
