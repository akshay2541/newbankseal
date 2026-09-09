import { sha256Hex } from './crypto';

/**
 * Fixed-window rate limiter with a pluggable store.
 *
 * The default store is in-process, which is correct for a single node and for local
 * development but NOT for a horizontally scaled deployment — wire `RATE_LIMIT_REDIS_URL`
 * and register a Redis store via `setRateLimitStore` before scaling out.
 *
 * Identifiers are hashed before they become keys so raw IPs and email addresses are
 * never held in the limiter's memory or persisted.
 */

export interface RateLimitStore {
  /** Atomically increment `key` and return the new count plus the window reset time. */
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
  reset(key: string): Promise<void>;
}

class InMemoryRateLimitStore implements RateLimitStore {
  #buckets = new Map<string, { count: number; resetAt: number }>();
  #lastSweep = 0;

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    this.#sweep(now);

    const existing = this.#buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.#buckets.set(key, fresh);
      return fresh;
    }

    existing.count += 1;
    return existing;
  }

  async reset(key: string) {
    this.#buckets.delete(key);
  }

  /** Bounded cleanup so a flood of unique keys cannot grow the map without limit. */
  #sweep(now: number) {
    if (now - this.#lastSweep < 30_000) return;
    this.#lastSweep = now;
    for (const [key, bucket] of this.#buckets) {
      if (bucket.resetAt <= now) this.#buckets.delete(key);
    }
  }
}

let store: RateLimitStore = new InMemoryRateLimitStore();

export function setRateLimitStore(next: RateLimitStore): void {
  store = next;
}

export interface RateLimitRule {
  /** Stable name, forms part of the key so rules never collide. */
  name: string;
  limit: number;
  windowMs: number;
}

/** Tuned per-endpoint. Authentication limits are deliberately tight. */
export const RATE_LIMITS = {
  login: { name: 'login', limit: 5, windowMs: 15 * 60_000 },
  register: { name: 'register', limit: 3, windowMs: 60 * 60_000 },
  passwordReset: { name: 'password-reset', limit: 3, windowMs: 60 * 60_000 },
  enquiry: { name: 'enquiry', limit: 10, windowMs: 60 * 60_000 },
  search: { name: 'search', limit: 60, windowMs: 60_000 },
  // Matches the quota the listing assistant shows the visitor.
  listingQuestion: { name: 'listing-question', limit: 5, windowMs: 60 * 60_000 },
  api: { name: 'api', limit: 120, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(rule: RateLimitRule, identifier: string): Promise<RateLimitResult> {
  const key = `${rule.name}:${await sha256Hex(identifier)}`;
  const { count, resetAt } = await store.increment(key, rule.windowMs);

  const allowed = count <= rule.limit;
  return {
    allowed,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

export async function resetRateLimit(rule: RateLimitRule, identifier: string): Promise<void> {
  await store.reset(`${rule.name}:${await sha256Hex(identifier)}`);
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) }),
  };
}
