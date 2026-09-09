import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { ActionIcon, type ActionIconKey } from '@/components/ui/action-icon';
import { BankLogo } from '@/components/ui/bank-logo';
import { ShareIcon, type ShareIconKey } from '@/components/ui/share-icon';
import { AdSlot } from '@/features/explore/components/ad-slot';
import { AskPanel } from '@/features/listing/components/ask-panel';
import { EmiCalculator } from '@/features/listing/components/emi-calculator';
import { FaqCard } from '@/features/listing/components/faq-card';
import { ListingGallery } from '@/features/listing/components/listing-gallery';
import { LockedCard } from '@/features/listing/components/locked-card';
import { NearbyPlaces } from '@/features/listing/components/nearby-places';
import { OverviewCard } from '@/features/listing/components/overview-card';
import { PremiumCard } from '@/features/listing/components/premium-card';
import { ScoreCard } from '@/features/listing/components/score-card';
import { SimilarListings } from '@/features/listing/components/similar-listings';
import { clientEnv } from '@/lib/env';
import { formatInr } from '@/lib/format';
import { getCurrentSession } from '@/server/auth/current-user';
import { getListingDetail } from '@/server/services/listing-detail-service';
import { SUGGESTED_QUESTIONS } from '@/server/services/listing-qa';

/**
 * Listing detail.
 *
 * Dynamic because the payload depends on the viewer: an entitled viewer's response
 * carries the borrower, address and bank contact, and an ordinary visitor's does not.
 * Caching this route would risk serving one viewer's entitled payload to another.
 */
export const dynamic = 'force-dynamic';

/** Slugs are user-supplied path segments; bound them before they reach a query. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,199}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) return { title: 'Listing not found' };

  const data = await getListingDetail(slug, null).catch(() => null);
  if (!data) return { title: 'Listing not found' };

  return {
    title: data.listing.title,
    description: `${data.listing.propertyTypeLabel} in ${data.listing.cityName}, auctioned by ${data.listing.bankName}. Reserve ${formatInr(data.listing.reservePriceInr)}.`,
    alternates: { canonical: `/listings/${data.listing.slug}` },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) notFound();

  const session = await getCurrentSession();
  const data = await getListingDetail(slug, session);
  if (!data) notFound();

  const { listing, similar, score, canViewProtected } = data;
  const shareUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/listings/${listing.slug}`;

  return (
    <Container className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link href="/" className="rounded-md bg-ink-100 px-2.5 py-1.5 font-medium text-ink-600 hover:bg-ink-200">
            Home
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5 text-ink-400" />
          <Link
            href={`/explore?city=${encodeURIComponent(listing.citySlug)}`}
            className="rounded-md bg-ink-100 px-2.5 py-1.5 font-medium text-ink-600 hover:bg-ink-200"
          >
            {listing.cityName}
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5 text-ink-400" />
          <span aria-current="page" className="rounded-md bg-ink-100 px-2.5 py-1.5 font-medium text-ink-700">
            Product Details
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <HeaderAction label="Share this listing" icon="share" text="Share" />
          <HeaderAction label="Save to watchlist" icon="heart" text="Favorite" />
        </div>
      </div>

      <div className="mt-4">
        <ListingGallery images={listing.images} title={listing.title} />
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-brand-600 sm:text-2xl">
            {listing.title}
          </h1>
          <Link
            href={`/banks/${encodeURIComponent(listing.bankSlug)}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
          >
            <BankLogo name={listing.bankName} slug={listing.bankSlug} logoUrl={listing.bankLogoUrl} />
            {listing.bankName}
          </Link>
        </div>

        <div className="text-right">
          <p className="font-display text-xl font-bold text-success-500 sm:text-2xl">
            {formatInr(listing.reservePriceInr)}
          </p>
          {listing.priceDropPercent ? (
            <p className="mt-0.5 text-xs text-ink-500">
              Reduced {listing.priceDropPercent}% from {formatInr(listing.previousReservePriceInr ?? 0)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          <LockedCard title="Borrower Name" field={listing.borrowerName} />
          <OverviewCard listing={listing} />
          <LockedCard title="Location" field={listing.fullAddress} />

          <BankContactCard contact={listing.bankContact} bankName={listing.bankName} />

          <LockedCard
            title="Download Auction File"
            field={listing.auctionFileUrl}
            emptyText="The bank has not published the notice for this lot yet."
          />

          <NearbyPlaces
            latitude={listing.latitude}
            longitude={listing.longitude}
            places={listing.nearbyPlaces}
          />

          <AdSlot className="h-40" />
          <FaqCard />
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink-900">Share</h2>
            <ul className="mt-4 flex items-center gap-4">
              {shareTargets(shareUrl).map((target) => (
                <li key={target.label}>
                  <a
                    href={target.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={target.label}
                    className="inline-flex size-11.5 items-center justify-center rounded-xl bg-glyph-well text-glyph transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    <ShareIcon icon={target.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          <AskPanel slug={listing.slug} suggestions={SUGGESTED_QUESTIONS} />
          <ScoreCard score={score} />
          <EmiCalculator reservePriceInr={listing.reservePriceInr} emdAmountInr={listing.emdAmountInr} />

          {canViewProtected ? null : <PremiumCard />}
          <AdSlot className="h-52" />
        </aside>
      </div>

      <div className="mt-8">
        <SimilarListings
          listings={similar}
          viewAllHref={`/explore?city=${encodeURIComponent(listing.citySlug)}`}
        />
      </div>
    </Container>
  );
}

function shareTargets(url: string): ReadonlyArray<{ label: string; href: string; icon: ShareIconKey }> {
  const encoded = encodeURIComponent(url);
  return [
    { label: 'Share on WhatsApp', href: `https://wa.me/?text=${encoded}`, icon: 'whatsapp' },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, icon: 'facebook' },
    { label: 'Share on Twitter', href: `https://twitter.com/intent/tweet?url=${encoded}`, icon: 'twitter' },
    { label: 'Share by email', href: `mailto:?body=${encoded}`, icon: 'email' },
  ];
}

function HeaderAction({ label, icon, text }: { label: string; icon: ActionIconKey; text: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-border-subtle bg-surface px-3.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
    >
      <ActionIcon icon={icon} className="size-3.5" />
      {text}
    </button>
  );
}

function BankContactCard({
  contact,
  bankName,
}: {
  contact: { locked: boolean; name: string | null; phone: string | null; email: string | null };
  bankName: string;
}) {
  return (
    <LockedCard
      title="Bank Contact Details"
      field={
        contact.locked
          ? { locked: true }
          : {
              locked: false,
              value:
                [contact.name, contact.phone, contact.email].filter(Boolean).join(' · ') ||
                `${bankName} has not published a direct contact for this lot.`,
            }
      }
    />
  );
}
