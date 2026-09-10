import { Container } from '@/components/ui/container';
import { Rail } from '@/components/ui/rail';
import { SectionHeading } from '@/components/ui/section-heading';
import type { ListingCard } from '@/domain/listing';
import { PropertyCard } from './property-card';

/**
 * A horizontally scrolling band of listings — used for both "New Listed Properties"
 * and "Top Properties". Renders nothing when there is no inventory rather than
 * showing an empty rail with dead arrows.
 */
export function ListingRail({
  id,
  lead,
  highlight,
  viewAllHref,
  listings,
  variant = 'detailed',
  priorityFirstCard = false,
}: {
  id: string;
  lead: string;
  highlight?: string;
  viewAllHref: string;
  listings: ListingCard[];
  variant?: 'overlay' | 'detailed';
  priorityFirstCard?: boolean;
}) {
  if (listings.length === 0) return null;

  return (
    <Container as="section" className="pt-section" aria-labelledby={`${id}-heading`}>
      <SectionHeading id={`${id}-heading`} lead={lead} highlight={highlight} viewAllHref={viewAllHref} />

      <Rail ariaLabel={`${lead} ${highlight ?? ''}`.trim()}>
        {listings.map((listing, index) => (
          <PropertyCard
            key={listing.id}
            listing={listing}
            variant={variant}
            priority={priorityFirstCard && index === 0}
            className="rail-item w-[85vw] max-w-[380px] sm:w-[45vw] lg:w-[380px]"
          />
        ))}
      </Rail>
    </Container>
  );
}
