import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { CityIcon } from '@/components/ui/city-icon';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import type { CityFacet } from '@/domain/listing';
import { formatCount } from '@/lib/format';

/**
 * "Top Cities" — the highest-volume markets, each fronted by its landmark.
 *
 * Icons are resolved from the city slug by `CityIcon`, so adding a city to the seed
 * automatically picks up its artwork if we have it and falls back to a generic
 * building if we don't.
 */
export function TopCities({ cities }: { cities: CityFacet[] }) {
  if (cities.length === 0) return null;

  return (
    <Container as="section" className="pt-section" aria-labelledby="top-cities-heading">
      <SectionHeading id="top-cities-heading" lead="Top" highlight="Cities" viewAllHref="/cities" />

      <Card className="p-card">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-block sm:grid-cols-3 lg:grid-cols-6">
          {cities.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/explore?city=${encodeURIComponent(city.slug)}`}
                className="group flex flex-col items-center gap-2.5 rounded-xl py-2 text-center transition-colors hover:bg-ink-50"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl text-ink-700 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 sm:size-14">
                  <CityIcon slug={city.slug} className="size-7 sm:size-8" />
                </span>

                <span className="text-xs font-medium text-ink-800 group-hover:text-brand-700">
                  {city.name} <span className="font-normal text-ink-400">({formatCount(city.listingCount)})</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </Container>
  );
}
