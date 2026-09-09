'use client';

import { useId, useMemo, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Rail } from '@/components/ui/rail';
import { SectionHeading } from '@/components/ui/section-heading';
import { TabList, type TabItem } from '@/components/ui/tab-list';
import type { ListingCard } from '@/domain/listing';
import { PropertyCard } from './property-card';

const ALL_KEY = 'all';

/** `locationLabel` is composed server-side as "Locality, City, State". */
function localityOf(listing: ListingCard): string {
  return listing.locationLabel.split(',')[0]?.trim() ?? '';
}

/**
 * "Top Properties" — a listing rail with a locality filter strip above it.
 *
 * The localities are derived from the listings already on the page rather than
 * fetched separately, so a tab can never point at an empty result and no extra
 * round-trip is needed to render the strip. Every card stays in the markup the
 * server sent; selecting a tab narrows which ones the rail renders.
 */
export function LocalityListingRail({
  id,
  lead,
  highlight,
  viewAllHref,
  listings,
  /** Localities beyond this are dropped — the strip is a shortcut, not a directory. */
  maxTabs = 12,
}: {
  id: string;
  lead: string;
  highlight?: string;
  viewAllHref: string;
  listings: ListingCard[];
  maxTabs?: number;
}) {
  const baseId = useId();
  const [activeKey, setActiveKey] = useState(ALL_KEY);

  const tabs = useMemo<TabItem[]>(() => {
    // Insertion order, so the strip follows the order listings are ranked in.
    const localities = new Map<string, string>();
    for (const listing of listings) {
      const label = localityOf(listing);
      if (label && !localities.has(label)) localities.set(label, label);
    }

    return [
      { key: ALL_KEY, label: `All ${highlight ?? lead}` },
      ...[...localities.keys()].slice(0, maxTabs).map((label) => ({ key: label, label })),
    ];
  }, [listings, lead, highlight, maxTabs]);

  const visible = useMemo(
    () => (activeKey === ALL_KEY ? listings : listings.filter((listing) => localityOf(listing) === activeKey)),
    [listings, activeKey],
  );

  if (listings.length === 0) return null;

  // A locality that vanishes from the data between renders must not strand the strip
  // on a tab that no longer exists.
  const selectedKey = tabs.some((tab) => tab.key === activeKey) ? activeKey : ALL_KEY;

  return (
    <Container as="section" className="pt-12" aria-labelledby={`${id}-heading`}>
      <SectionHeading id={`${id}-heading`} lead={lead} highlight={highlight} viewAllHref={viewAllHref} />

      {tabs.length > 1 ? (
        <TabList
          tabs={tabs}
          activeKey={selectedKey}
          onSelect={setActiveKey}
          ariaLabel={`Filter ${lead} ${highlight ?? ''}`.trim().concat(' by locality')}
          tabId={(key) => `${baseId}-tab-${key}`}
          panelId={() => `${baseId}-panel`}
        />
      ) : null}

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${selectedKey}`}>
        <Rail ariaLabel={`${lead} ${highlight ?? ''}`.trim()}>
          {visible.map((listing) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              variant="detailed"
              className="rail-item w-[85vw] max-w-[380px] sm:w-[45vw] lg:w-[380px]"
            />
          ))}
        </Rail>
      </div>
    </Container>
  );
}
