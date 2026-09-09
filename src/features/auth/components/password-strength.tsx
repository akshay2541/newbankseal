'use client';

import { cn } from '@/lib/cn';

/**
 * Password strength meter.
 *
 * Purely advisory feedback — the actual policy is enforced by `passwordSchema` on the
 * server. Scoring favours length over character-class gymnastics, which is what
 * current guidance (NIST SP 800-63B) recommends.
 */
const LEVELS = [
  { label: 'Too short', className: 'bg-danger-500', width: 'w-1/4' },
  { label: 'Weak', className: 'bg-warning-500', width: 'w-2/4' },
  { label: 'Good', className: 'bg-brand-500', width: 'w-3/4' },
  { label: 'Strong', className: 'bg-success-500', width: 'w-full' },
] as const;

function score(password: string): number {
  if (password.length < 12) return 0;

  let points = 1;
  if (password.length >= 16) points += 1;
  // Variety still helps against dictionary attacks, just less than length does.
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].filter((pattern) => pattern.test(password)).length;
  if (classes >= 3) points += 1;

  return Math.min(points, LEVELS.length - 1);
}

export function PasswordStrength({ password }: { password: string }) {
  if (password.length === 0) return null;

  const level = LEVELS[score(password)];
  if (!level) return null;

  return (
    <div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
        <div className={cn('h-full rounded-full transition-all duration-300', level.className, level.width)} />
      </div>
      {/* Announced politely so it doesn't interrupt typing. */}
      <p aria-live="polite" className="mt-1.5 text-xs text-ink-500">
        Password strength: <span className="font-medium text-ink-700">{level.label}</span>
      </p>
    </div>
  );
}
