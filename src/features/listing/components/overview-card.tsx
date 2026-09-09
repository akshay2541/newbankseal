import { Card } from '@/components/ui/card';
import { POSSESSION_DETAIL_LABEL, type ListingDetail } from '@/domain/listing';
import { formatDateTime, formatInr } from '@/lib/format';

/**
 * The specification table.
 *
 * Rows are built from what the record actually holds — a field the bank hasn't supplied
 * renders an explicit dash rather than being dropped, so the grid keeps its shape and a
 * missing figure reads as missing instead of as an oversight.
 */
export function OverviewCard({ listing }: { listing: ListingDetail }) {
  const facts: Array<{ label: string; value: string | null }> = [
    { label: 'Property Type', value: listing.propertyTypeLabel },
    { label: 'Area', value: listing.areaLabel },
    { label: 'Possession', value: POSSESSION_DETAIL_LABEL[listing.possessionType] },
    { label: 'Building', value: listing.buildingName },
    { label: 'Locality', value: listing.locality },
    { label: 'City', value: listing.cityName },
    { label: 'Reserve Price', value: formatInr(listing.reservePriceInr) },
    { label: 'EMD Amount', value: formatInr(listing.emdAmountInr) },
    { label: 'Bid Increment', value: listing.bidIncrementInr === null ? null : formatInr(listing.bidIncrementInr) },
    { label: 'EMD Submission', value: listing.emdDueAt ? formatDateTime(listing.emdDueAt) : null },
    { label: 'Auction Start Date & Time', value: listing.auctionStartsAt ? formatDateTime(listing.auctionStartsAt) : null },
    { label: 'Auction End Date & Time', value: listing.auctionEndsAt ? formatDateTime(listing.auctionEndsAt) : null },
  ];

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink-900">Overview</h2>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-2xs text-ink-400">{fact.label}</dt>
            <dd className="mt-1 text-[0.8125rem] font-medium break-words text-ink-900">
              {fact.value ?? <span className="text-ink-400">—</span>}
            </dd>
          </div>
        ))}
      </dl>

      {listing.description ? (
        <div className="mt-6 border-t border-border-subtle pt-4">
          <h3 className="text-2xs text-ink-400">Overview</h3>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-700">{listing.description}</p>
        </div>
      ) : null}
    </Card>
  );
}
