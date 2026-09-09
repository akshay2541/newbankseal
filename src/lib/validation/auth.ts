import { z } from 'zod';

/**
 * Input contracts for authentication.
 *
 * These schemas are the server's validation — the client reuses them for instant
 * feedback, but every route parses the raw body through them again. Client-side
 * validation is a convenience; it is never a control.
 */

/** Trim and lower-case so casing and stray whitespace can't create duplicate accounts. */
export const emailSchema = z
  .string()
  .trim()
  .min(3, 'Enter your email address')
  .max(320, 'Email address is too long')
  .email('Enter a valid email address')
  .transform((value) => value.toLowerCase());

/**
 * Length is the dominant factor in password strength, so the floor is 12 characters
 * with a generous ceiling. The hard cap matters: Argon2 will happily hash a 10 MB
 * string and burn a request worker doing it.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .refine((value) => value.trim() === value, 'Password cannot start or end with a space');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name')
  .max(120, 'Name is too long')
  // Letters, marks, spaces, hyphens and apostrophes only. Blocks control characters
  // and markup from reaching any surface that renders a name.
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, "Use letters, spaces, hyphens and apostrophes only");

/** Indian mobile numbers, optionally with a +91 prefix. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'));

export const signUpSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
    marketingOptIn: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const localPart = data.email.split('@')[0] ?? '';
      return localPart.length < 4 || !data.password.toLowerCase().includes(localPart);
    },
    { message: 'Password must not contain your email address', path: ['password'] },
  );

export const signInSchema = z.object({
  email: emailSchema,
  // No length or complexity rules on sign-in. Enforcing the policy here would only
  // tell an attacker what it is, and verification fails on a bad password regardless.
  password: z.string().min(1, 'Enter your password').max(128),
  // Bounded and validated so it cannot become an open redirect: must be a site-relative
  // path, and anything protocol-relative or absolute is discarded rather than rejected.
  next: z
    .string()
    .max(512)
    .optional()
    .transform((value) => (value && isSafeRedirectPath(value) ? value : undefined)),
});

/**
 * A redirect target is only accepted when it is a single-slash-prefixed relative path.
 * `//evil.com` and `https://evil.com` are both rejected — the first is protocol-relative
 * and would leave the site, which is the classic open-redirect bug.
 */
export function isSafeRedirectPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (value.includes('\\')) return false;
  return /^\/[\w\-./?=&%+]*$/.test(value);
}

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

/** Query contract for the public browse surface. */
export const exploreQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Invalid city')
    .optional(),
  category: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Invalid category')
    .optional(),
  bank: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Invalid bank')
    .optional(),
  possession: z.enum(['physical', 'symbolic', 'constructive']).optional(),
  /** Marketing shortcuts surfaced as filter pills. */
  tag: z.enum(['popular', 'car-auction']).optional(),
  sort: z.enum(['newest', 'featured', 'price_asc', 'price_desc']).default('newest'),
  // Page is capped so a crafted `?page=999999` cannot force a huge OFFSET scan.
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type ExploreQuery = z.infer<typeof exploreQuerySchema>;

/** Contract for the listing assistant. */
export const listingQuestionSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Invalid listing'),
  // Bounded hard: this string is only ever matched against keywords, never executed
  // or interpolated, but an unbounded body is still a denial-of-service vector.
  question: z.string().trim().min(3, 'Ask a question').max(300, 'Keep questions under 300 characters'),
});

export type ListingQuestionInput = z.infer<typeof listingQuestionSchema>;
