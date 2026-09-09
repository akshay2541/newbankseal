'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/csrf-client';
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
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-500">Sign in to track auctions and manage your watchlist.</p>
      </header>

      <FormAlert message={formError} />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
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

        <Field label="Password" error={fieldErrors.password?.[0]} required>
          {(props) => <PasswordInput {...props} name="password" autoComplete="current-password" required />}
        </Field>

        <div className="flex justify-end">
          <Link href="/reset-password" className="text-xs font-medium text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New to Bank Seal?{' '}
        <Link href="/sign-up" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
