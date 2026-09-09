import 'server-only';

import type { ListingCard, ListingDetail, ListingSignal } from '@/domain/listing';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/server/auth/rbac';
import type { SessionContext } from '@/server/auth/session';
import { findListingBySlug, findSimilarListings } from '@/server/repositories/listing-repository';
import { buildListingDetailFallback } from './listing-detail-fallback';

export interface ListingDetailData {
  listing: ListingDetail;
  similar: ListingCard[];
  score: ListingScore;
  canViewProtected: boolean;
}

export interface ListingScore {
  /** 0-100. Presented as a rounded readout, never as a precise claim. */
  value: number;
  signals: ListingSignal[];
}

/**
 * Derive the listing's summary score.
 *
 * Every reading below is computed from a fact already on the record — the revised
 * reserve price, the auction date, how much media is attached, how much inventory the
 * city carries, which lender is selling. Nothing is invented, and nothing calls a model.
 *
 * This is a heuristic summary, and the page says so. It is deliberately not framed as
 * advice: a buyer acting on a wrong signal here is out real money, so the wording
 * describes what was observed rather than what to do.
 */
export function scoreListing(listing: ListingDetail, cityInventory: number): ListingScore {
  const signals: ListingSignal[] = [];
  let score = 50;

  if (listing.priceDropPercent && listing.priceDropPercent > 0) {
    score += Math.min(listing.priceDropPercent, 25);
    signals.push({
      tone: 'positive',
      text: `Reserve has been revised down ${listing.priceDropPercent}% from the previous notice.`,
    });
  } else {
    signals.push({ tone: 'caution', text: 'Reserve is unchanged from the original notice.' });
  }

  const startsAt = listing.auctionStartsAt ? new Date(listing.auctionStartsAt) : null;
  const daysAway = startsAt ? Math.ceil((startsAt.getTime() - Date.now()) / 86_400_000) : null;

  if (daysAway === null) {
    signals.push({ tone: 'caution', text: 'Auction date is not yet published for this lot.' });
    score -= 5;
  } else if (daysAway < 0) {
    signals.push({ tone: 'negative', text: 'The published auction date has already passed.' });
    score -= 20;
  } else if (daysAway <= 14) {
    signals.push({ tone: 'caution', text: `Auction is ${daysAway} days away — EMD deadlines will be tight.` });
  } else {
    score += 8;
    signals.push({ tone: 'positive', text: `Auction is ${daysAway} days away, leaving time for due diligence.` });
  }

  if (listing.images.length >= 4) {
    score += 8;
    signals.push({ tone: 'positive', text: `${listing.images.length} photographs are on file for this lot.` });
  } else {
    score -= 8;
    signals.push({
      tone: 'negative',
      text: 'Limited media on file — request the full auction notice and title deed before bidding.',
    });
  }

  if (cityInventory >= 50) {
    score += 6;
    signals.push({ tone: 'positive', text: `${listing.cityName} has an active resale market for this asset type.` });
  } else if (cityInventory > 0) {
    signals.push({ tone: 'caution', text: `${listing.cityName} sees relatively few auctions of this kind.` });
  }

  if (listing.possessionType === 'physical') {
    score += 8;
    signals.push({ tone: 'positive', text: 'Physical possession — the lender holds the keys.' });
  } else {
    score -= 10;
    signals.push({
      tone: 'negative',
      text: 'Possession is not physical; the occupant may still need to be removed after purchase.',
    });
  }

  return { value: Math.max(0, Math.min(100, Math.round(score))), signals };
}

/** Load everything the detail page renders, or null when no such public listing exists. */
export async function getListingDetail(
  slug: string,
  session: SessionContext | null,
): Promise<ListingDetailData | null> {
  const canViewProtected = session ? hasPermission(session.user.role, 'listing:view_protected') : false;

  if (!process.env.DATABASE_URL) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      logger.error('listing_detail.database_not_configured');
      throw new Error('DATABASE_URL is not configured.');
    }
    logger.warn('listing_detail.using_fallback_content');
    return buildListingDetailFallback(slug, canViewProtected);
  }

  const listing = await findListingBySlug(slug, { canViewProtected });
  if (!listing) return null;

  // Enough to fill the rail and give it something to scroll; three would render a
  // carousel with nowhere to go.
  const similar = await findSimilarListings(listing.id, listing.citySlug, 9);

  return {
    listing,
    similar,
    // Inventory depth stands in for how liquid the local market is.
    score: scoreListing(listing, similar.length * 8),
    canViewProtected,
  };
}
