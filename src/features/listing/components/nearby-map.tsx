'use client';

import 'leaflet/dist/leaflet.css';

import type { Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useRef } from 'react';
import type { NearbyPlace } from '@/domain/listing';

/**
 * The map behind "Nearby Places".
 *
 * Leaflet with OpenStreetMap tiles: no API key, no third-party script, and the library
 * ships from our own bundle rather than a CDN, so the CSP only needs the tile host
 * added to `img-src`.
 *
 * NOTE FOR REVIEW: OpenStreetMap's tile servers are run on donations and their usage
 * policy does not permit heavy commercial traffic. Before launch, move to a paid tile
 * provider (MapTiler, Mapbox, Thunderforest) or self-host tiles. Only the URL template
 * and attribution below need to change.
 *
 * Loaded through `next/dynamic` with SSR off by its parent — Leaflet touches `window`
 * at import time and cannot be evaluated on the server.
 */
export default function NearbyMap({
  latitude,
  longitude,
  places,
  activeId,
  onSelect,
}: {
  latitude: number;
  longitude: number;
  places: NearbyPlace[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  // Captured once so cleanup operates on the same Map instance the effect populated,
  // not whatever the ref happens to point at when the effect tears down.
  const markers = markersRef.current;

  // Create the map once. Leaflet is imported dynamically so this module stays
  // importable in environments without a DOM.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 13,
        // The page scrolls; hijacking the wheel would trap the reader inside the map.
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        // Attribution is a licence condition of ODbL, not decoration — do not remove.
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // The listing itself, drawn distinctly from the points of interest.
      L.circleMarker([latitude, longitude], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#1570ef',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip('Approximate location', { direction: 'top' });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, [latitude, longitude, markers]);

  // Re-draw the points of interest whenever the selected category changes.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;
      if (cancelled || !map) return;

      for (const marker of markers.values()) marker.remove();
      markers.clear();

      for (const place of places) {
        if (place.latitude === null || place.longitude === null) continue;

        const marker = L.circleMarker([place.latitude, place.longitude], {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: place.id === activeId ? '#0f5acc' : '#5aa2fa',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(`${place.name} · ${place.distanceKm.toFixed(2)} km`, { direction: 'top' })
          .on('click', () => onSelect(place.id));

        markers.set(place.id, marker as unknown as Marker);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [places, activeId, onSelect, markers]);

  return (
    <div
      ref={containerRef}
      // Decorative relative to the list beside it, which carries the same names and
      // distances as text — so the map is not the only way to reach the information.
      role="presentation"
      className="relative isolate z-0 h-full w-full [&_.leaflet-container]:font-sans"
    />
  );
}
