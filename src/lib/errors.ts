/**
 * Application error taxonomy.
 *
 * Every error that reaches a client passes through `toPublicError`, which strips
 * stack traces, driver messages and internal identifiers. Only errors explicitly
 * marked `expose` have their message forwarded.
 */

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'CSRF_FAILED'
  | 'INTERNAL';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  CSRF_FAILED: 403,
  INTERNAL: 500,
};

/** Messages safe to show a user. Anything else is replaced by these. */
const SAFE_MESSAGE: Record<ErrorCode, string> = {
  BAD_REQUEST: 'The request could not be processed.',
  UNAUTHENTICATED: 'You must be signed in to do that.',
  FORBIDDEN: 'You do not have permission to do that.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'That action conflicts with the current state.',
  VALIDATION_FAILED: 'Some of the submitted values are invalid.',
  RATE_LIMITED: 'Too many requests. Please try again shortly.',
  CSRF_FAILED: 'Your session could not be verified. Please refresh and try again.',
  INTERNAL: 'Something went wrong on our end.',
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** When true the message is user-authored and safe to return verbatim. */
  readonly expose: boolean;
  /** Field-level detail for form rendering. Never contains internal state. */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: { expose?: boolean; fieldErrors?: Record<string, string[]>; cause?: unknown },
  ) {
    super(message ?? SAFE_MESSAGE[code], { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.expose = options?.expose ?? message === undefined;
    this.fieldErrors = options?.fieldErrors;
  }
}

export const badRequest = (m?: string) => new AppError('BAD_REQUEST', m, { expose: Boolean(m) });
export const unauthenticated = () => new AppError('UNAUTHENTICATED');
export const forbidden = () => new AppError('FORBIDDEN');
export const notFound = () => new AppError('NOT_FOUND');
export const conflict = (m?: string) => new AppError('CONFLICT', m, { expose: Boolean(m) });
export const rateLimited = () => new AppError('RATE_LIMITED');

export function validationFailed(fieldErrors: Record<string, string[]>) {
  return new AppError('VALIDATION_FAILED', undefined, { fieldErrors });
}

export interface PublicError {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Normalise any thrown value into a response body that leaks nothing.
 * Unknown throwables always become a generic 500.
 */
export function toPublicError(error: unknown): { status: number; body: PublicError } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.expose ? error.message : SAFE_MESSAGE[error.code],
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    };
  }

  return { status: 500, body: { code: 'INTERNAL', message: SAFE_MESSAGE.INTERNAL } };
}
