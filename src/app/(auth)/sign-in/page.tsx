import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { isSafeRedirectPath } from '@/lib/validation/auth';
import { getCurrentSession } from '@/server/auth/current-user';

export const metadata: Metadata = {
  title: 'Sign in',
  // Authentication pages must stay out of search results and caches.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Already signed in — no reason to show the form again.
  if (await getCurrentSession()) redirect('/dashboard');

  const params = await searchParams;
  const rawNext = typeof params.next === 'string' ? params.next : undefined;
  // Validated here as well as in the schema so a crafted `?next=` can never reach the
  // form as a live off-site URL.
  const next = rawNext && isSafeRedirectPath(rawNext) ? rawNext : undefined;

  return <SignInForm next={next} />;
}
