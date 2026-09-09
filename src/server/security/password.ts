import 'server-only';

import { hash, verify } from '@node-rs/argon2';

/**
 * Password hashing with Argon2id.
 *
 * Parameters follow the OWASP Password Storage Cheat Sheet (m=19456 KiB, t=2, p=1).
 * `ALGO_VERSION` is persisted alongside the hash so that raising these costs later
 * lets us transparently rehash on the next successful login instead of forcing a reset.
 */
export const ALGO_VERSION = 1;

const OPTIONS = {
  // Argon2id
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

/** A pre-computed hash used to burn equivalent CPU when an email doesn't exist. */
let dummyHashPromise: Promise<string> | null = null;

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, OPTIONS);
}

export async function verifyPassword(storedHash: string, plaintext: string): Promise<boolean> {
  try {
    return await verify(storedHash, plaintext, OPTIONS);
  } catch {
    // A malformed stored hash must fail closed, not throw a 500 that distinguishes it.
    return false;
  }
}

/**
 * Defeats user-enumeration by timing. Call this on the "no such user" branch of a
 * login so that the response takes the same order of magnitude as a real verification.
 */
export async function burnEquivalentWork(plaintext: string): Promise<void> {
  dummyHashPromise ??= hash('bank-seal-timing-equaliser', OPTIONS);
  const dummy = await dummyHashPromise;
  await verifyPassword(dummy, plaintext);
}

/** True when a stored hash was produced by an older parameter set and should be upgraded. */
export function needsRehash(algoVersion: number): boolean {
  return algoVersion < ALGO_VERSION;
}
