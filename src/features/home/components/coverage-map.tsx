'use client';

import 'leaflet/dist/leaflet.css';

import type { FeatureCollection } from 'geojson';
import type { LatLngExpression, Layer, Map as LeafletMap } from 'leaflet';
import { type CSSProperties, useEffect, useRef } from 'react';
import { formatCount } from '@/lib/format';
import type { MapMarker } from './india-map';
import indiaStates from '../india-states.json';

/**
 * India coverage map, drawn by Leaflet.
 *
 * The pins, their popups and their placement are the library's: Leaflet owns opening,
 * positioning, collision with the viewport edge, closing on outside click and on
 * Escape, and it re-projects everything when the container resizes. That is the whole
 * reason this replaced a hand-drawn SVG with hand-written popup state.
 *
 * Deliberately no tile layer. The design calls for flat grey states on the page ground,
 * not a street map, so only the boundary GeoJSON is drawn. Which also means no tile
 * requests, no attribution obligation, no third-party host in the CSP and nothing to
 * pay for — the geometry ships in the bundle (48 KB, simplified from Natural Earth).
 *
 * Every navigation gesture is off. This is a coverage illustration inside a marketing
 * section: a pannable, zoomable map here would swallow page scroll on a phone and
 * wander out of its framing.
 *
 * BOUNDARY NOTE, carried over from the SVG this replaces: Natural Earth depicts
 * internationally-recognised boundaries, which differ from the Government of India's
 * official depiction of Jammu & Kashmir and Ladakh. Indian law requires the Survey of
 * India depiction. Replace `india-states.json` with an SoI-derived outline before
 * launch — nothing in this component needs to change with it.
 */

/**
 * Pin footprint in screen pixels — just above the glyph's drawn height.
 *
 * Enough that two stacked pins clear each other, and no more. Pushing harder than the
 * artwork needs throws a pin clean off its state, which on a country-scale map reads as
 * the wrong city rather than a tidier cluster.
 *
 * It doubles as each pin's hit area, published to CSS as `--bs-pin-hit`. The two have
 * to be the same number: a larger hit area would overlap the neighbouring pin's centre
 * and swallow taps meant for it, which is exactly what happens at phone widths where
 * the whole Gujarat cluster is barely 40px across. That puts the target under the 44px
 * comfortable minimum, accepted here because the map is an illustration and every city
 * and count it shows is repeated as text in the coverage card beside it.
 */
const MIN_SEPARATION = 24;

/** Leaflet's `fitBounds` inset, in pixels, so pins near the coast are not clipped. */
const FIT_PADDING: [number, number] = [16, 26];

const PIN_SIZE: [number, number] = [15, 20];

/** The same teardrop the SVG map drew, so the swap is invisible. */
function pinSvg(): string {
  return `<svg width="15" height="20" viewBox="0 0 22 30" fill="none" aria-hidden="true">
    <path d="M11 0C4.925 0 0 4.925 0 11c0 7.7 11 19 11 19s11-11.3 11-19c0-6.075-4.925-11-11-11Z" class="bs-pin-body" />
    <circle cx="11" cy="11" r="4.2" fill="#fff" />
  </svg>`;
}

/** Goes into Leaflet's popup as a string, so the interpolations are escaped by hand. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

function popupHtml(marker: MapMarker): string {
  return `<p class="bs-popup-city">${escapeHtml(marker.city)}</p>
    <p class="bs-popup-count"><strong>${escapeHtml(formatCount(marker.listings))}</strong> listings</p>`;
}

interface Placement {
  marker: MapMarker;
  /** Screen position of the city itself. */
  anchor: { x: number; y: number };
  /** Where the pin is drawn, after collision resolution. */
  pin: { x: number; y: number };
  displaced: boolean;
}

/**
 * Spread overlapping pins apart, in screen space.
 *
 * The covered cities are clustered in south Gujarat — Surat and Navsari are under 5px
 * apart at the rendered size — so drawn at their true positions the pins sit on top of
 * one another and the upper ones swallow clicks meant for the lower ones. This is the
 * standard cartographic answer: nudge colliding markers outward and draw a leader back
 * to the real coordinate, so every pin stays reachable without lying about location.
 *
 * Screen space rather than degrees, because the separation that matters is the one the
 * reader sees; the same nudge in degrees would be too small on a wide screen and too
 * large on a narrow one.
 */
function place(markers: readonly MapMarker[], project: (marker: MapMarker) => { x: number; y: number }): Placement[] {
  const placed: Placement[] = [];

  // North to south, so the fan reads naturally and ties break the same way every time.
  const ordered = [...markers].sort((a, b) => b.lat - a.lat || a.city.localeCompare(b.city));

  for (const marker of ordered) {
    const anchor = project(marker);
    let { x, y } = anchor;

    for (let pass = 0; pass < 24; pass += 1) {
      let collided = false;

      for (const other of placed) {
        const dx = x - other.pin.x;
        const dy = y - other.pin.y;
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

    placed.push({ marker, anchor, pin: { x, y }, displaced: Math.hypot(x - anchor.x, y - anchor.y) > 1 });
  }

  return placed;
}

export default function CoverageMap({ markers }: { markers: readonly MapMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      // Leaflet touches `window` at import time, so it is pulled in here rather than at
      // module scope. The parent already renders this client-only for the same reason.
      const L = await import('leaflet');
      if (cancelled || mapRef.current) return;

      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        // An illustration, not a tool: nothing here should move under the reader.
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
        keyboard: false,
        // Fractional zoom, so the country fills whatever width the column happens to
        // be instead of snapping to the next whole level and leaving a margin.
        zoomSnap: 0,
      });

      const boundary = L.geoJSON(indiaStates as FeatureCollection, {
        // The flat grey-on-white treatment the design uses for the states.
        style: { fillColor: '#c9ced6', fillOpacity: 1, color: '#ffffff', weight: 1.4, lineJoin: 'round' },
        // Only the pins are interactive; a click on Rajasthan should do nothing.
        interactive: false,
      }).addTo(map);

      const bounds = boundary.getBounds();
      const overlays: Layer[] = [];

      const draw = () => {
        map.fitBounds(bounds, { padding: FIT_PADDING, animate: false });

        for (const layer of overlays) layer.remove();
        overlays.length = 0;

        const placements = place(markers, (marker) => map.latLngToContainerPoint([marker.lat, marker.lon]));

        for (const { marker, anchor, pin, displaced } of placements) {
          const anchorLatLng = map.containerPointToLatLng([anchor.x, anchor.y]);
          const pinLatLng = map.containerPointToLatLng([pin.x, pin.y]);

          if (displaced) {
            // Leader back to the true coordinate, so a nudged pin still tells the truth.
            overlays.push(
              L.polyline([anchorLatLng, pinLatLng] as LatLngExpression[], {
                color: '#1570ef',
                opacity: 0.6,
                weight: 1.5,
                interactive: false,
              }).addTo(map),
              L.circleMarker(anchorLatLng, {
                radius: 2,
                color: '#1570ef',
                fillColor: '#1570ef',
                fillOpacity: 1,
                weight: 0,
                interactive: false,
              }).addTo(map),
            );
          }

          const label = `${marker.city}: ${formatCount(marker.listings)} listings`;

          const pinMarker = L.marker(pinLatLng, {
            icon: L.divIcon({
              className: 'bs-pin',
              html: pinSvg(),
              iconSize: PIN_SIZE,
              // The tip, not the centre, sits on the point.
              iconAnchor: [PIN_SIZE[0] / 2, PIN_SIZE[1]],
              popupAnchor: [0, -PIN_SIZE[1] + 2],
            }),
            // Focusable and Enter-activated, which is what the old `<button>` gave us.
            keyboard: true,
            title: label,
            alt: label,
            riseOnHover: true,
          })
            .addTo(map)
            .bindPopup(popupHtml(marker), { className: 'bs-popup', closeButton: false, autoPan: false });

          // Leaflet marks nothing on the marker when its popup opens, so the darker
          // active pin is flagged here rather than derived in React state.
          pinMarker.on('popupopen', () => pinMarker.getElement()?.classList.add('is-open'));
          pinMarker.on('popupclose', () => pinMarker.getElement()?.classList.remove('is-open'));

          overlays.push(pinMarker);
        }
      };

      draw();

      // Re-project when the column changes width — Leaflet does not watch its own box,
      // and the pin placement above is computed in pixels, so it has to be redone.
      const observer = new ResizeObserver(() => {
        map.invalidateSize({ animate: false });
        draw();
      });
      observer.observe(container);

      // Leaflet closes a popup when the map itself is clicked, and its Escape handling
      // rides on the keyboard handler that is switched off above. Neither covers a
      // click elsewhere on the page, which is the other half of what a reader expects
      // of a popup — so both are wired at the document here.
      const onPointerDown = (event: PointerEvent) => {
        if (!container.contains(event.target as Node)) map.closePopup();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') map.closePopup();
      };

      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);

      mapRef.current = map;
      teardown = () => {
        observer.disconnect();
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [markers]);

  return (
    <div
      ref={containerRef}
      // The aspect the SVG map drew at, so nothing around it shifts.
      //
      // `isolate` is load-bearing: Leaflet gives its panes z-index values up to 1000,
      // and without a stacking context of their own those resolve against the root and
      // paint over the sticky header and the mobile menu panel.
      // `bs-map` carries the flat, transparent look; it has to be a plain class in
      // globals.css rather than utilities here, because Leaflet's own stylesheet paints
      // this same element and loads after Tailwind's.
      className="bs-map relative isolate z-0 aspect-1000/1071 w-full"
      style={{ '--bs-pin-hit': `${MIN_SEPARATION}px` } as CSSProperties}
      role="group"
      aria-label="Cities where we currently list auctions"
    />
  );
}
