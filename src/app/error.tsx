'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

/**
 * Route-level error boundary.
 *
 * Renders a fixed message and only ever surfaces Next's `digest` — the correlation id
 * for the server-side log entry. The underlying error message, stack and any database
 * detail stay on the server.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side breadcrumb; the authoritative record was written server-side.
    console.error('route_error', { digest: error.digest });
  }, [error.digest]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section-lg text-center">
      <h1 className="font-display text-h2 font-bold tracking-tight text-ink-900">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-500">
        We hit an unexpected problem loading this page. Please try again in a moment.
      </p>

      {error.digest ? (
        <p className="mt-4 font-mono text-2xs text-ink-400">Reference: {error.digest}</p>
      ) : null}

      <div className="mt-block flex flex-wrap justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </Container>
  );
}
