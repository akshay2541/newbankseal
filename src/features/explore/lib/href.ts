import type { ExploreQuery } from '@/lib/validation/auth';

/**
 * Build a URL for the browse page with some parameters changed.
 *
 * Kept in its own module with no component imports so both Server and Client
 * Components can use it without dragging a component tree across the boundary.
 *
 * Defaults are omitted rather than written out, so the canonical URL for an unfiltered
 * page stays clean and two routes to the same view produce the same string.
 */
export function buildExploreHref(query: ExploreQuery, patch: Partial<ExploreQuery>): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set('q', next.q);
  if (next.city) params.set('city', next.city);
  if (next.category) params.set('category', next.category);
  if (next.bank) params.set('bank', next.bank);
  if (next.possession) params.set('possession', next.possession);
  if (next.tag) params.set('tag', next.tag);
  if (next.sort && next.sort !== 'newest') params.set('sort', next.sort);
  if (next.page && next.page > 1) params.set('page', String(next.page));

  const search = params.toString();
  return search ? `/explore?${search}` : '/explore';
}
