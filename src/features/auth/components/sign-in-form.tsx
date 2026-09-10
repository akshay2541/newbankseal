'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/csrf-client';
import { siteConfig } from '@/lib/site-config';
import { isSafeRedirectPath, signInSchema } from '@/lib/validation/auth';
import { FormAlert } from './form-alert';
import { PasswordInput } from './password-input';

/**
 * Sign-in form.
 *
 * Client-side validation mirrors the server schema for fast feedback only — the route
 * re-validates everything. The form never reports whether an address exists: a failed
 * attempt always renders the same sentence.
 */
export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      next,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setPending(true);
    try {
      const response = await apiFetch('/api/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as { message?: string } | null;
        setFormError(problem?.message ?? 'We could not sign you in. Check your details and try again.');
        return;
      }

      const result = (await response.json()) as { redirectTo?: string };
      const destination =
        result.redirectTo && isSafeRedirectPath(result.redirectTo) ? result.redirectTo : '/dashboard';

      // Refresh first so Server Components re-read the new session cookie.
      router.refresh();
      router.push(destination);
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-2xs font-semibold tracking-wide text-brand-700 uppercase">
          <ShieldCheck className="size-3" aria-hidden="true" />
          Secure sign in
        </span>
        <h1 className="mt-3.5 font-display text-[1.75rem] leading-tight font-bold tracking-tight text-ink-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Sign in to track auctions and manage your watchlist.
        </p>
      </header>

      <FormAlert message={formError} />

      <form onSubmit={onSubmit} noValidate className="space-y-5">
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

        <Field
          label="Password"
          error={fieldErrors.password?.[0]}
          required
          // On the label row rather than under the field: it belongs to the password,
          // and below it competed with the submit button for the same glance.
          action={
            <Link
              href="/reset-password"
              className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          {(props) => <PasswordInput {...props} name="password" autoComplete="current-password" required />}
        </Field>

        <Button type="submit" size="lg" className="mt-2 h-12 w-full text-[0.9375rem]" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 border-t border-border-subtle pt-5 text-center text-sm text-ink-500">
        New to {siteConfig.name}?{' '}
        <Link href="/sign-up" className="font-semibold text-brand-600 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
