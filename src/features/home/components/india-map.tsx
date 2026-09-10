'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/cn';

/**
 * India coverage map for the homepage.
 *
 * Thin wrapper whose only job is to keep Leaflet off the server: the library reads
 * `window` at import time, so the real component is loaded client-only. Everything the
 * map does lives in `coverage-map.tsx`.
 *
 * The placeholder holds the exact aspect the map draws at, so the section does not
 * reflow when it arrives.
 */
export interface MapMarker {
  city: string;
  lon: number;
  lat: number;
  listings: number;
}

const CoverageMap = dynamic(() => import('./coverage-map'), {
  ssr: false,
  loading: () => <div className="aspect-1000/1071 w-full animate-pulse rounded-xl bg-ink-100" aria-hidden="true" />,
});

export function IndiaMap({ markers, className }: { markers: readonly MapMarker[]; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <CoverageMap markers={markers} />
    </div>
  );
}
