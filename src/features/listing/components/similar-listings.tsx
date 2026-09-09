import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BankLogo } from '@/components/ui/bank-logo';
import { Rail } from '@/components/ui/rail';
import { POSSESSION_LABEL, type ListingCard } from '@/domain/listing';
import { formatDate, formatInr } from '@/lib/format';

/**
 * "Similar Auction Properties".
 *
 * A horizontal rail of compact cards rather than the browse page's wide rows: this sits
 * in a narrower context under the detail content, and the row layout would either wrap
 * badly or force the section to run the full page height.
 *
 * Reuses the shared `Rail`, so it inherits the same native scroll-snap behaviour and
 * arrow affordances as the homepage carousels instead of inventing a second mechanism.
 */
export function SimilarListings({ listings, viewAllHref }: { listings: ListingCard[]; viewAllHref: string }) {
  if (listings.length === 0) return null;

  return (
    <Card className="p-5" aria-labelledby="similar-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="similar-heading" className="text-[0.9375rem] font-bold text-ink-900">
          Similar Auction Properties
        </h2>

        <Link
          href={viewAllHref}
          className="inline-flex h-9 shrink-0 items-center rounded-btn bg-brand-50 px-4 text-[0.8125rem] font-medium text-brand-600 transition-colors hover:bg-brand-100"
        >
          View All
        </Link>
      </div>

      <Rail ariaLabel="Similar auction properties">
        {listings.map((listing) => (
          <SimilarCard key={listing.id} listing={listing} />
        ))}
      </Rail>
    </Card>
  );
}

function SimilarCard({ listing }: { listing: ListingCard }) {
  const href = `/listings/${listing.slug}`;

  const meta = [listing.auctionDate ? formatDate(listing.auctionDate) : null, `EMD ${formatInr(listing.emdAmountInr)}`]
    .filter(Boolean)
    .join('  |  ');

  return (
    <article className="rail-item relative flex w-[19rem] flex-col rounded-xl bg-ink-50 p-4 sm:w-[21rem]">
      <h3 className="truncate text-[0.9375rem] font-semibold text-brand-600">
        {/* Stretched link: one target for the whole card, one tab stop. */}
        <Link href={href} className="hover:underline after:absolute after:inset-0 after:content-['']">
          {listing.title}
        </Link>
      </h3>

      <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-ink-500">
        <BankLogo
          name={listing.bankName}
          slug={listing.bankName}
          logoUrl={listing.bankLogoUrl}
          className="size-4 rounded-sm"
        />
        <span className="truncate">{listing.bankName}</span>
      </p>

      <p className="mt-2.5 text-[0.8125rem] text-ink-600">{meta}</p>
      <p className="mt-1 text-[0.8125rem] text-ink-600">{POSSESSION_LABEL[listing.possessionType]}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-base font-bold text-success-500">{formatInr(listing.reservePriceInr)}</p>

        {/* Above the stretched link so it stays its own target. */}
        <Button asChild variant="dark" size="sm" className="relative z-10 h-9 px-4 text-[0.8125rem]">
          <Link href={href}>View Auction</Link>
        </Button>
      </div>
    </article>
  );
}
