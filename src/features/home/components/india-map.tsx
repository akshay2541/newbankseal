'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { INDIA_REGIONS, INDIA_VIEWBOX, projectToMap } from '@/components/ui/india-geo';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

/**
 * India coverage map: real state boundaries with a clickable pin per covered city.
 *
 * Boundaries are SVG; pins and popups are HTML positioned over the top. A `<button>`
 * gets real keyboard and screen-reader behaviour for free where an SVG `<g>` does not,
 * and the popup can use ordinary layout and shadows instead of being trapped in the
 * SVG coordinate space.
 *
 * Pin anchors come from each city's true longitude/latitude through `projectToMap`,
 * the same projection the boundaries were generated with, converted to percentages so
 * they track the map at any rendered size.
 */
export interface MapMarker {
  city: string;
  lon: number;
  lat: number;
  listings: number;
}

/**
 * Pin footprint in viewBox units, sized for the map's largest rendered width.
 *
 * Kept just above the glyph's drawn height (20px over a ~512px map, so ~39 units) —
 * enough that two stacked pins clear each other, and no more. Pushing harder than
 * the artwork needs throws a pin clean off its state, which on a country-scale map
 * reads as the wrong city rather than a tidier cluster.
 */
const MIN_SEPARATION = 39;

/**
 * Snap a computed coordinate to two decimals before it reaches the DOM.
 *
 * `Math.log`, `Math.atan2` and friends are implementation-defined in ECMAScript, so
 * Node and V8 can disagree in the final ULP. Rendered straight into an SVG attribute
 * that shows up as a hydration mismatch. Two decimals is ~1/100th of a viewBox unit —
 * far below a pixel at any size this draws at — and makes both sides agree exactly.
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

interface PlacedMarker extends MapMarker {
  /** Where the city actually is. */
  anchorX: number;
  anchorY: number;
  /** Where its pin is drawn, after collision resolution. */
  pinX: number;
  pinY: number;
  displaced: boolean;
}

/**
 * Spread overlapping pins apart.
 *
 * The covered cities are clustered in south Gujarat — Surat and Navsari are under 5px
 * apart at the rendered size — so drawn at their true positions the pins sit on top of
 * one another and the upper ones swallow clicks meant for the lower ones. This is the
 * standard cartographic answer: nudge colliding markers outward and draw a leader back
 * to the real coordinate, so every pin stays reachable without lying about location.
 *
 * Deterministic: same input always yields the same layout, so the map does not
 * reshuffle between server and client render.
 */
function placeMarkers(markers: readonly MapMarker[]): PlacedMarker[] {
  const placed: PlacedMarker[] = [];

  // North to south, so the fan reads naturally and ties break the same way every time.
  const ordered = [...markers].sort((a, b) => b.lat - a.lat || a.city.localeCompare(b.city));

  for (const marker of ordered) {
    const anchor = projectToMap(marker.lon, marker.lat);
    let x = anchor.x;
    let y = anchor.y;

    for (let pass = 0; pass < 24; pass += 1) {
      let collided = false;

      for (const other of placed) {
        const dx = x - other.pinX;
        const dy = y - other.pinY;
        const distance = Math.hypot(dx, dy);
        if (distance >= MIN_SEPARATION) continue;

        collided = true;
        // Exactly coincident: push straight down rather than dividing by zero.
        const angle = distance < 0.001 ? Math.PI / 2 : Math.atan2(dy, dx);
        const push = MIN_SEPARATION - distance;
        x += Math.cos(angle) * push;
        y += Math.sin(angle) * push;
      }

      if (!collided) break;
    }

    placed.push({
      ...marker,
      anchorX: round(anchor.x),
      anchorY: round(anchor.y),
      pinX: round(x),
      pinY: round(y),
      displaced: Math.hypot(x - anchor.x, y - anchor.y) > 3,
    });
  }

  return placed;
}

export function IndiaMap({ markers, className }: { markers: readonly MapMarker[]; className?: string }) {
  const { width, height } = INDIA_VIEWBOX;
  const [openCity, setOpenCity] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const placed = useMemo(() => placeMarkers(markers), [markers]);

  // Dismiss on outside click and on Escape, the two things people expect of a popup.
  useEffect(() => {
    if (!openCity) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenCity(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenCity(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openCity]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <g className="fill-ink-300 stroke-white" strokeWidth={2.5} strokeLinejoin="round">
          {INDIA_REGIONS.map((region) =>
            region.rings.map((d, index) => <path key={`${region.name}-${index}`} d={d} />),
          )}
        </g>

        {/* Leaders tying a nudged pin back to where the city really is. */}
        <g className="stroke-brand-600/60" strokeWidth={3} strokeLinecap="round">
          {placed
            .filter((marker) => marker.displaced)
            .map((marker) => (
              <g key={`leader-${marker.city}`}>
                <line x1={marker.anchorX} y1={marker.anchorY} x2={marker.pinX} y2={marker.pinY} />
                <circle cx={marker.anchorX} cy={marker.anchorY} r={4} className="fill-brand-600 stroke-none" />
              </g>
            ))}
        </g>
      </svg>

      {placed.map((marker) => {
        const left = round((marker.pinX / width) * 100);
        const top = round((marker.pinY / height) * 100);
        const open = openCity === marker.city;
        const popupId = `${baseId}-${marker.city.toLowerCase().replace(/\s+/g, '-')}`;

        return (
          <div
            key={marker.city}
            className={cn('absolute', open ? 'z-20' : 'z-10')}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {/* Anchored so the pin's tip, not its centre, sits on the point. */}
            <button
              type="button"
              onClick={() => setOpenCity(open ? null : marker.city)}
              aria-expanded={open}
              aria-controls={open ? popupId : undefined}
              aria-label={`${marker.city}: ${formatCount(marker.listings)} listings`}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-full cursor-pointer rounded-full transition-transform',
                'hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
                open && 'scale-110',
              )}
            >
              <PinGlyph active={open} />
            </button>

            {open ? (
              <div
                id={popupId}
                role="dialog"
                aria-label={`${marker.city} coverage`}
                className="popover-panel absolute bottom-7 left-1/2 z-20 w-max -translate-x-1/2 rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-center shadow-float"
              >
                <p className="text-sm font-semibold text-ink-900">{marker.city}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  <span className="font-medium text-brand-600">{formatCount(marker.listings)}</span> listings
                </p>

                {/* Tail pointing down at the pin. */}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-r border-b border-border-subtle bg-surface"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Teardrop marker, drawn at a fixed pixel size so it stays legible at any map scale. */
function PinGlyph({ active }: { active: boolean }) {
  return (
    <svg width="15" height="20" viewBox="0 0 22 30" fill="none" aria-hidden="true" className="drop-shadow-sm">
      <path
        d="M11 0C4.925 0 0 4.925 0 11c0 7.7 11 19 11 19s11-11.3 11-19c0-6.075-4.925-11-11-11Z"
        className={active ? 'fill-brand-700' : 'fill-brand-600'}
      />
      <circle cx="11" cy="11" r="4.2" className="fill-white" />
    </svg>
  );
}
