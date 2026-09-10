import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section-lg text-center">
      <p className="font-display text-sm font-semibold tracking-wide text-brand-600 uppercase">404</p>
      <h1 className="mt-3 font-display text-h2 font-bold tracking-tight text-ink-900">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-500">
        The listing may have been withdrawn, sold, or the link may be out of date.
      </p>

      <div className="mt-block flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">Browse auctions</Link>
        </Button>
      </div>
    </Container>
  );
}
