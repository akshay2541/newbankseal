import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { requireSessionOrRedirect } from '@/server/auth/current-user';
import { hasPermission } from '@/server/auth/rbac';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Authenticated landing page.
 *
 * Demonstrates the two-step authorization pattern used throughout the app:
 * `requireSessionOrRedirect` establishes *who* is asking, then `hasPermission` decides
 * *what* they may see. Neither check looks at a role string directly.
 */
export default async function DashboardPage() {
  const session = await requireSessionOrRedirect('/dashboard');
  const canPublish = hasPermission(session.user.role, 'listing:publish');
  const canAudit = hasPermission(session.user.role, 'audit:read');

  return (
    <Container className="py-section">
      <h1 className="font-display text-h2 font-bold tracking-tight text-ink-900">
        Welcome back, {session.user.fullName.split(' ')[0]}
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Signed in as <span className="font-medium text-ink-700">{session.user.email}</span>
      </p>

      <div className="mt-block grid gap-gap sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-card">
          <h2 className="text-sm font-semibold text-ink-900">Watchlist</h2>
          <p className="mt-1.5 text-xs text-ink-500">Auctions you are tracking will appear here.</p>
        </Card>

        <Card className="p-card">
          <h2 className="text-sm font-semibold text-ink-900">Your enquiries</h2>
          <p className="mt-1.5 text-xs text-ink-500">Interest you have expressed, and the bank&apos;s responses.</p>
        </Card>

        {canPublish ? (
          <Card className="p-card">
            <h2 className="text-sm font-semibold text-ink-900">Listing review queue</h2>
            <p className="mt-1.5 text-xs text-ink-500">Submitted listings awaiting your approval.</p>
          </Card>
        ) : null}

        {canAudit ? (
          <Card className="p-card">
            <h2 className="text-sm font-semibold text-ink-900">Audit log</h2>
            <p className="mt-1.5 text-xs text-ink-500">Security-sensitive actions across the platform.</p>
          </Card>
        ) : null}
      </div>
    </Container>
  );
}
