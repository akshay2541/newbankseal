import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { getCurrentSession } from '@/server/auth/current-user';

export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  if (await getCurrentSession()) redirect('/dashboard');

  return <SignUpForm />;
}
