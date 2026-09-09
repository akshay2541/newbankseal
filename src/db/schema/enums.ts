import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Roles are ordered least- to most-privileged. Authorization is never done by
 * comparing strings at a call site — always go through `src/server/auth/rbac.ts`.
 */
export const userRoleEnum = pgEnum('user_role', ['buyer', 'seller', 'bank_officer', 'admin']);

export const userStatusEnum = pgEnum('user_status', ['pending_verification', 'active', 'suspended', 'deactivated']);

export const assetTypeEnum = pgEnum('asset_type', [
  'residential',
  'commercial',
  'industrial',
  'vehicle',
  'machinery',
  'gold',
  'land',
]);

export const listingStatusEnum = pgEnum('listing_status', [
  'draft',
  'pending_review',
  'published',
  'auction_live',
  'sold',
  'withdrawn',
  'expired',
]);

export const saleTypeEnum = pgEnum('sale_type', ['sarfaesi', 'liquidation', 'drt', 'private_treaty']);

export const enquiryStatusEnum = pgEnum('enquiry_status', ['new', 'contacted', 'qualified', 'closed']);

/**
 * How the lender holds the asset. Physical possession means the bank has the keys;
 * symbolic means it holds title but the occupant is still in place, which materially
 * changes what a buyer is taking on — so it is a first-class filter, not a note.
 */
export const possessionTypeEnum = pgEnum('possession_type', ['physical', 'symbolic', 'constructive']);

/** Units auctions are actually quoted in across India. */
export const areaUnitEnum = pgEnum('area_unit', ['sqft', 'sqyd', 'sqm', 'acre', 'hectare']);

/** Categories the "Nearby Places" tabs filter by. */
export const nearbyCategoryEnum = pgEnum('nearby_category', [
  'connectivity',
  'hospital',
  'school',
  'restaurant',
  'banking',
]);
