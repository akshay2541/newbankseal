import Image from 'next/image';
import Link from 'next/link';
import { Images } from 'lucide-react';
import { ActionIcon, type ActionIconKey } from '@/components/ui/action-icon';
import { BankLogo } from '@/components/ui/bank-logo';
import { Button } from '@/components/ui/button';
import { POSSESSION_LABEL, type ListingCard } from '@/domain/listing';
import { cn } from '@/lib/cn';
import { formatDate, formatInr } from '@/lib/format';

/**
 * A single result row on the browse page.
 *
 * The design shows one card that flexes rather than several card types: the thumbnail,
 * the re-auction tag and the price-drop tag each appear only when the listing carries
 * that data, so the same component covers every variant in the mock. Rows without a
 * thumbnail simply close the gap.
 */
export function ListingRow({ listing }: { listing: ListingCard }) {
  const href = `/listings/${listing.slug}`;

  const meta = [
    listing.auctionDate ? formatDate(listing.auctionDate) : null,
    `EMD ${formatInr(listing.emdAmountInr)}`,
    listing.areaSqft ? `${listing.areaSqft.toLocaleString('en-IN')} Sq Ft` : null,
  ].filter(Boolean);

  return (
    <article className="relative flex gap-4 rounded-card border border-border-subtle bg-surface p-4 transition-shadow hover:shadow-card">
      {listing.imageUrl ? (
        <div className="relative hidden h-[4.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-ink-100 sm:block">
          <Image
            src={listing.imageUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes="104px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <h3 className="text-[0.9375rem] font-semibold text-brand-600">
            {/* Stretched link: the whole row is one target, one tab stop. */}
            <Link href={href} className="hover:underline after:absolute after:inset-0 after:content-['']">
              {listing.title}
            </Link>
          </h3>

          <div className="flex items-center gap-2.5">
            {listing.isReauction ? <Tag tone="neutral">Re auction - Same Price</Tag> : null}

            {listing.priceDropPercent && listing.previousReservePriceInr ? (
              <Tag tone="success">
                {listing.priceDropPercent}% Drop from {formatInr(listing.previousReservePriceInr)}
              </Tag>
            ) : null}

            <p className="text-[0.9375rem] font-bold whitespace-nowrap text-success-500">
              {formatInr(listing.reservePriceInr)}
            </p>
          </div>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <BankLogo
            name={listing.bankName}
            slug={listing.bankName}
            logoUrl={listing.bankLogoUrl}
            className="size-4 rounded-sm"
          />
          {listing.bankName}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-600">
            {listing.photoCount > 1 ? (
              <span className="flex items-center gap-1 text-ink-700">
                <Images className="size-3.5 text-ink-400" aria-hidden="true" />
                {listing.photoCount} Photos
                <Divider />
              </span>
            ) : null}

            {meta.map((item, index) => (
              <span key={item} className="flex items-center gap-2">
                {item}
                {index < meta.length - 1 ? <Divider /> : null}
              </span>
            ))}

            <Divider />
            <span>{POSSESSION_LABEL[listing.possessionType]}</span>
          </p>

          {/* Above the stretched link so each stays its own target. */}
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <IconAction label={`Share ${listing.title}`} icon="share" />
            <IconAction label={`Save ${listing.title} to watchlist`} icon="heart" />
            <Button asChild variant="dark" size="sm" className="h-10 px-4 text-[0.8125rem]">
              <Link href={href}>View Auction</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Divider() {
  return (
    <span aria-hidden="true" className="text-ink-300">
      |
    </span>
  );
}

function Tag({ tone, children }: { tone: 'neutral' | 'success'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-2xs font-medium whitespace-nowrap',
        tone === 'success' ? 'bg-success-soft text-success-500' : 'bg-ink-100 text-ink-600',
      )}
    >
      {children}
    </span>
  );
}

function IconAction({ label, icon }: { label: string; icon: ActionIconKey }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-btn bg-action-well text-action-glyph transition-colors hover:bg-brand-50 hover:text-brand-600"
    >
      <ActionIcon icon={icon} />
    </button>
  );
}
