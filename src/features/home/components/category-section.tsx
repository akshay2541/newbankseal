import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BankLogo } from '@/components/ui/bank-logo';
import { Container } from '@/components/ui/container';
import { IconTile } from '@/components/ui/icon-tile';
import { SectionHeading } from '@/components/ui/section-heading';
import type { BankFacet, CategoryFacet } from '@/domain/listing';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

/**
 * "Category Auctions" — a three-column grid of category rows, followed by the
 * partner-bank list.
 *
 * Both blocks sit directly on the page background: the design gives the categories no
 * card and separates the bank list with a rule rather than a panel, so the only boxed
 * elements are the icon tile, the arrow affordance and the bank chips themselves.
 */
export function CategorySection({
  categories,
  banks,
  activeBankSlug,
}: {
  categories: CategoryFacet[];
  banks: BankFacet[];
  /** Highlights the matching chip. Set on a bank landing page; unset on the homepage. */
  activeBankSlug?: string;
}) {
  return (
    <Container as="section" className="pt-section" aria-labelledby="category-auctions-heading">
      <SectionHeading id="category-auctions-heading" lead="Category" highlight="Auctions" className="mb-6" />

      <ul className="grid gap-x-6 gap-y-block sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/explore?category=${encodeURIComponent(category.slug)}`}
              className="group flex min-w-0 items-center gap-2.5 rounded-card p-1 transition-colors hover:bg-ink-100/60 sm:gap-3"
            >
              <IconTile iconKey={category.iconKey} size="lg" className="size-12 rounded-xl sm:size-14 sm:rounded-2xl" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-600">{category.name}</span>
                <span className="mt-0.5 block text-body font-bold text-ink-900">
                  {formatCount(category.listingCount)}
                </span>
              </span>

              <span
                aria-hidden="true"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-ink-900 transition-colors group-hover:bg-brand-100 sm:size-13"
              >
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h3 className="mt-section font-display text-h4 font-bold tracking-tight text-ink-900">
        Popular Bank e-Auction Properties
      </h3>
      <hr className="mt-4 border-t border-border-subtle" />

      <ul className="mt-block flex flex-wrap gap-gap">
        {banks.map((bank) => {
          const active = bank.slug === activeBankSlug;

          return (
            <li key={bank.slug}>
              <Link
                href={`/banks/${encodeURIComponent(bank.slug)}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-control items-center gap-2 rounded-xl border px-3.5 text-meta transition-colors sm:gap-2.5 sm:px-5 sm:text-body',
                  active
                    ? 'border-brand-600 bg-surface font-medium text-ink-900'
                    : 'border-transparent bg-brand-50 text-ink-700 hover:border-brand-200 hover:bg-brand-100',
                )}
              >
                <BankLogo name={bank.name} slug={bank.slug} logoUrl={bank.logoUrl} />
                {bank.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
