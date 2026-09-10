import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SALE_TYPE_LABEL, type ListingCard } from '@/domain/listing';
import { cn } from '@/lib/cn';
import { formatDate, formatInr } from '@/lib/format';

/**
 * The listing tile, in the two treatments the design uses:
 *  - `overlay` — image-led card with the title burned into a gradient (New Listed rail);
 *  - `detailed` — image plus a white body carrying EMD, dates and a location footer
 *    (Top Properties rail).
 *
 * All text originates from the database and is rendered as JSX children, so React
 * escapes it. `dangerouslySetInnerHTML` is never used on listing content.
 */
export function PropertyCard({
  listing,
  variant = 'detailed',
  priority = false,
  className,
}: {
  listing: ListingCard;
  variant?: 'overlay' | 'detailed';
  priority?: boolean;
  className?: string;
}) {
  const href = `/listings/${listing.slug}`;
  const metaLine = [
    listing.auctionDate ? formatDate(listing.auctionDate) : null,
    listing.areaSqft ? `${listing.areaSqft.toLocaleString('en-IN')} Sq Ft` : null,
  ]
    .filter(Boolean)
    .join('  |  ');

  if (variant === 'overlay') {
    return (
      <article
        className={cn(
          'group relative isolate overflow-hidden rounded-card border border-border-subtle bg-ink-900',
          className,
        )}
      >
        <ListingImage listing={listing} priority={priority} className="h-56 sm:h-60" />

        {/* Gradient scrim keeps the white title readable over any photograph. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent" />

        <div className="absolute top-3 right-3 flex gap-2">
          <IconAction label="Save to watchlist" icon={Heart} />
          <IconAction label="Share listing" icon={Share2} />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {/* The whole card is clickable via this stretched link — one tab stop, one target. */}
              <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                {listing.title}
              </Link>
            </h3>
            <p className="mt-1 truncate text-2xs text-white/75">{metaLine}</p>
            <p className="mt-0.5 truncate text-2xs text-white/60">{listing.locationLabel}</p>
          </div>

          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-transform group-hover:scale-105"
          >
            <MapPin className="size-4" />
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card border border-border-subtle bg-surface shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
    >
      <div className="relative">
        <ListingImage listing={listing} priority={priority} className="h-44 sm:h-48" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge tone="inverse" size="sm">
            {SALE_TYPE_LABEL[listing.saleType]}
          </Badge>
          {listing.priceDropPercent ? (
            <Badge tone="danger" size="sm" className="bg-danger-500 text-white">
              {listing.priceDropPercent}% Drop
            </Badge>
          ) : null}
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <IconAction label="Save to watchlist" icon={Heart} />
          <IconAction label="Share listing" icon={Share2} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink-900">
              <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                {listing.title}
              </Link>
            </h3>
            <p className="mt-1 text-2xs text-ink-500">{metaLine}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xs text-ink-400">EMD Amount</p>
            <p className="text-sm font-bold text-price">{formatInr(listing.emdAmountInr)}</p>
          </div>
        </div>

        <p className="mt-2 text-2xs text-ink-400">
          Reserve price <span className="font-medium text-ink-600">{formatInr(listing.reservePriceInr)}</span>
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <p className="flex min-w-0 items-center gap-1.5 text-2xs text-ink-500">
            <MapPin className="size-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">{listing.locationLabel}</span>
          </p>

          {/* Sits above the stretched link so it remains its own click target. */}
          <Button asChild variant="dark" size="sm" className="relative z-10 shrink-0">
            <Link href={href}>View Auction</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ListingImage({
  listing,
  priority,
  className,
}: {
  listing: ListingCard;
  priority: boolean;
  className?: string;
}) {
  if (!listing.imageUrl) {
    return (
      <div className={cn('flex w-full items-center justify-center bg-ink-100 text-ink-400', className)}>
        <MapPin className="size-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn('relative w-full overflow-hidden bg-ink-100', className)}>
      <Image
        src={listing.imageUrl}
        alt={listing.imageAlt}
        fill
        // Card widths across the responsive rail; keeps the optimiser from shipping
        // a 1200px source into a 280px slot on mobile.
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 85vw"
        priority={priority}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

function IconAction({ label, icon: Icon }: { label: string; icon: typeof Heart }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="tap-target relative z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-ink-600 shadow-card backdrop-blur transition-colors hover:bg-white hover:text-brand-600 sm:size-7"
    >
      <Icon className="size-3.5" />
    </button>
  );
}
