'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/csrf-client';
import { signUpSchema } from '@/lib/validation/auth';
import { FormAlert } from './form-alert';
import { PasswordInput } from './password-input';
import { PasswordStrength } from './password-strength';

/** Registration form. Mirrors the server schema; the route re-validates everything. */
export function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      acceptTerms: formData.get('acceptTerms') === 'on',
      marketingOptIn: formData.get('marketingOptIn') === 'on',
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setPending(true);
    try {
      const response = await apiFetch('/api/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as
          | { message?: string; fieldErrors?: Record<string, string[]> }
          | null;
        if (problem?.fieldErrors) setFieldErrors(problem.fieldErrors);
        setFormError(problem?.message ?? 'We could not create your account. Please try again.');
        return;
      }

      router.refresh();
      router.push('/dashboard');
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-2xs font-semibold tracking-wide text-success-500 uppercase">
          <BadgeCheck className="size-3" aria-hidden="true" />
          Free to join
        </span>
        <h1 className="mt-3.5 font-display text-[1.75rem] leading-tight font-bold tracking-tight text-ink-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Track auctions, save listings and express interest on verified bank-seized assets.
        </p>
      </header>

      <FormAlert message={formError} />

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Full name" error={fieldErrors.fullName?.[0]} required>
          {(props) => (
            <Input {...props} name="fullName" autoComplete="name" maxLength={120} placeholder="Akshay Solanki" required />
          )}
        </Field>

        <Field label="Email address" error={fieldErrors.email?.[0]} required>
          {(props) => (
            <Input
              {...props}
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              maxLength={320}
              placeholder="you@example.com"
              required
            />
          )}
        </Field>

        <Field label="Mobile number" hint="Optional — used for auction reminders." error={fieldErrors.phone?.[0]}>
          {(props) => (
            <Input {...props} name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" />
          )}
        </Field>

        <Field label="Password" hint="At least 12 characters." error={fieldErrors.password?.[0]} required>
          {(props) => (
            <PasswordInput
              {...props}
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          )}
        </Field>

        <PasswordStrength password={password} />

        <Field label="Confirm password" error={fieldErrors.confirmPassword?.[0]} required>
          {(props) => <PasswordInput {...props} name="confirmPassword" autoComplete="new-password" required />}
        </Field>

        <Checkbox
          name="acceptTerms"
          error={fieldErrors.acceptTerms?.[0]}
          label={
            <>
              I agree to the{' '}
              <Link href="/legal/terms" className="font-medium text-brand-600 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="font-medium text-brand-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </>
          }
        />

        <Checkbox name="marketingOptIn" label="Email me new listings that match my interests." />

        <Button type="submit" size="lg" className="mt-1 h-12 w-full text-[0.9375rem]" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 border-t border-border-subtle pt-5 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-brand-600 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

function Checkbox({
  name,
  label,
  error,
}: {
  name: string;
  label: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      {/* Padded rather than bare, so the tap area reaches the comfortable minimum
          without the 16px box growing into something that reads as a button. */}
      <label className="flex cursor-pointer items-start gap-2.5 rounded-btn py-1.5 transition-colors hover:bg-ink-50">
        <input
          type="checkbox"
          name={name}
          aria-invalid={Boolean(error)}
          className="mt-0.5 size-4 shrink-0 rounded border-border-strong text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/30"
        />
        <span className="text-xs leading-relaxed text-ink-600">{label}</span>
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-danger-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
