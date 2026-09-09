'use client';

import dynamic from 'next/dynamic';
import { Building2, GraduationCap, Landmark, Stethoscope, TrainFront, UtensilsCrossed } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  NEARBY_CATEGORY_LABEL,
  NEARBY_CATEGORY_ORDER,
  type NearbyCategory,
  type NearbyPlace,
} from '@/domain/listing';
import { cn } from '@/lib/cn';

/**
 * "Nearby Places": category tabs, a map, and a list of what's around the listing.
 *
 * The map is loaded lazily and client-only — Leaflet touches `window` at import time,
 * and there is no reason to ship a mapping library to someone who never scrolls this
 * far. Until it loads, the list is fully usable on its own.
 */
const NearbyMap = dynamic(() => import('./nearby-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ink-100" aria-hidden="true" />,
});

/** Icons are allow-listed rather than resolved from the category string. */
const CATEGORY_ICON = {
  connectivity: TrainFront,
  hospital: Stethoscope,
  school: GraduationCap,
  restaurant: UtensilsCrossed,
  banking: Landmark,
} as const;

export function NearbyPlaces({
  latitude,
  longitude,
  places,
}: {
  latitude: number | null;
  longitude: number | null;
  places: NearbyPlace[];
}) {
  // Open on the first tab that actually has entries, so the panel never starts empty.
  const available = useMemo(
    () => NEARBY_CATEGORY_ORDER.filter((category) => places.some((place) => place.category === category)),
    [places],
  );

  const [active, setActive] = useState<NearbyCategory>(available[0] ?? 'connectivity');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(
    () => places.filter((place) => place.category === active).sort((a, b) => a.distanceKm - b.distanceKm),
    [places, active],
  );

  const onSelect = useCallback((id: string) => setSelectedId(id), []);

  if (places.length === 0) return null;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink-900">Nearby Places</h2>

      <div role="tablist" aria-label="Nearby place categories" className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto pb-1">
        {available.map((category) => {
          const selected = category === active;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setActive(category);
                setSelectedId(null);
              }}
              className={cn(
                'inline-flex h-11 shrink-0 items-center rounded-lg border px-4 text-[0.8125rem] font-medium transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border-subtle bg-surface text-ink-700 hover:border-brand-200 hover:bg-brand-50',
              )}
            >
              {NEARBY_CATEGORY_LABEL[category]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 overflow-hidden rounded-card border border-border-subtle sm:grid-cols-[minmax(0,1fr)_16rem] sm:gap-0">
        <div className="h-72 sm:h-[28rem]">
          {latitude !== null && longitude !== null ? (
            <NearbyMap
              latitude={latitude}
              longitude={longitude}
              places={visible}
              activeId={selectedId}
              onSelect={onSelect}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-ink-50 px-6 text-center text-xs text-ink-400">
              <span className="flex items-center gap-2">
                <Building2 className="size-4" aria-hidden="true" />
                Coordinates have not been published for this lot.
              </span>
            </div>
          )}
        </div>

        {/* The authoritative version of the same information — readable without the map. */}
        <ul className="max-h-72 overflow-y-auto border-t border-border-subtle sm:max-h-[28rem] sm:border-t-0 sm:border-l">
          {visible.map((place) => {
            const Icon = CATEGORY_ICON[place.category];
            const selected = place.id === selectedId;

            return (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(place.id)}
                  aria-current={selected ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border-subtle px-4 py-3 text-left transition-colors last:border-b-0',
                    selected ? 'bg-brand-50' : 'hover:bg-ink-50',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500"
                  >
                    <Icon className="size-4" />
                  </span>

                  <span className="min-w-0">
                    <span className={cn('block text-xs font-medium', selected ? 'text-brand-700' : 'text-ink-800')}>
                      {place.name}
                    </span>
                    <span className="mt-0.5 block text-2xs tabular-nums text-ink-400">
                      {place.distanceKm.toFixed(2)} km
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-2 text-2xs text-ink-400">
        Distances are straight-line approximations from the listing&apos;s locality, not driving distance.
      </p>
    </Card>
  );
}
