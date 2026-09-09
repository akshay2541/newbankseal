/**
 * Subscription plans.
 *
 * Held as typed configuration rather than in the database because there is no billing
 * provider yet: a `plans` table with no checkout behind it would be schema without a
 * consumer. Move this to a table when payments are wired, so pricing can change without
 * a deploy.
 *
 * Every displayed percentage is derived from the two prices below rather than stored
 * alongside them. Two independent numbers that are supposed to agree eventually stop
 * agreeing, and on a pricing page that is a consumer-protection problem, not a typo.
 */

export interface Plan {
  id: string;
  name: string;
  months: number;
  /** List price in rupees, before discount. */
  listPriceInr: number;
  /** What the customer actually pays, in rupees. */
  priceInr: number;
}

/**
 * NOTE FOR REVIEW — two things in the supplied design need a commercial decision:
 *
 *  1. The 3-month row showed a "50% Savings" badge next to a "(10%)" figure on the same
 *     price pair. Only one can be right; both are now computed from the prices, so the
 *     badge and the parenthetical can never disagree again.
 *  2. The 6-month plan is priced identically to the 3-month plan (₹5,000 → ₹2,500),
 *     which means six months costs the same as three. The figures below reproduce the
 *     design exactly rather than inventing a price — set a real one before launch.
 */
export const PLANS: readonly Plan[] = [
  { id: '3-month', name: '3 Month', months: 3, listPriceInr: 5000, priceInr: 2500 },
  { id: '6-month', name: '6 Month', months: 6, listPriceInr: 5000, priceInr: 2500 },
  { id: '1-year', name: '1 Years', months: 12, listPriceInr: 10000, priceInr: 7000 },
];

/** What every plan includes. */
export const PLAN_FEATURES: readonly string[] = [
  'GST included',
  '3 Month premium',
  'Auction Document/Notice',
  'Auction History',
  'Daily mobile notification',
  'Daily email alert',
  'Multiple city email alert',
  'Email support',
];

/** Whole-number discount, floored so the saving is never overstated. */
export function discountPercent(plan: Plan): number {
  if (plan.listPriceInr <= plan.priceInr) return 0;
  return Math.floor(((plan.listPriceInr - plan.priceInr) / plan.listPriceInr) * 100);
}

export const DEFAULT_PLAN_ID = PLANS[0]?.id ?? '3-month';
