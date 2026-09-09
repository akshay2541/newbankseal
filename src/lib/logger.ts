/**
 * Structured JSON logger with secret redaction.
 *
 * Never log raw request bodies, cookies, tokens or password fields — the redactor
 * below is a safety net, not a licence to pass sensitive objects through.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const REDACT_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'currentpassword',
  'newpassword',
  'token',
  'sessiontoken',
  'session_token',
  'refreshtoken',
  'accesstoken',
  'secret',
  'authorization',
  'cookie',
  'setcookie',
  'set-cookie',
  'apikey',
  'api_key',
  'otp',
  'pan',
  'aadhaar',
  'creditcard',
  'cvv',
]);

const REDACTED = '[redacted]';

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[max-depth]';
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACT_KEYS.has(key.toLowerCase().replace(/[-_]/g, '')) ? REDACTED : redact(val, depth + 1);
  }
  return out;
}

function currentLevel(): Level {
  const raw = process.env.LOG_LEVEL;
  return raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error' ? raw : 'info';
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentLevel()]) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(context ? { context: redact(context) as Record<string, unknown> } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
};
