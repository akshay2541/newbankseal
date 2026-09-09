/**
 * Cryptographic primitives built on Web Crypto so the same module runs in the
 * Node.js runtime and in Edge middleware. No custom crypto is implemented here —
 * everything delegates to the platform.
 */

const encoder = new TextEncoder();

/** URL-safe base64 without padding. */
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cryptographically strong random token, URL-safe. 32 bytes = 256 bits of entropy. */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/**
 * SHA-256 digest, hex encoded. Used to store session and verification tokens at rest:
 * the plaintext token only ever exists in the user's cookie.
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(new Uint8Array(digest));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

/**
 * Verify an HMAC. Uses the platform's `verify`, which is constant-time, rather than
 * comparing strings — a naive `===` on a signature is a timing oracle.
 */
export async function hmacVerify(secret: string, message: string, signature: string): Promise<boolean> {
  try {
    const key = await importHmacKey(secret);
    const normalised = signature.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=');
    const raw = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, raw, encoder.encode(message));
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison for values that are not HMACs (e.g. two hex digests).
 * Always compares the full length of both inputs.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Length is not secret here (both are fixed-width digests), but the loop still
  // runs over a constant span so a mismatch position is not observable.
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}
