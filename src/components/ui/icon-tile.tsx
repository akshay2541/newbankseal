import {
  Building2,
  Car,
  CircleDollarSign,
  Factory,
  Home,
  Landmark,
  Recycle,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Icon rendering is allow-listed rather than dynamic.
 *
 * Category rows carry an `iconKey` string from the database. Mapping it through this
 * frozen record means a tampered row can only ever select one of these components —
 * it can never inject a component name or arbitrary markup into the tree.
 */
const ICONS = {
  vehicle: Car,
  residential: Home,
  industrial: Factory,
  commercial: Building2,
  machinery: Recycle,
  gold: CircleDollarSign,
  land: Landmark,
  retail: Store,
} as const satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

export function isIconKey(value: string): value is IconKey {
  return value in ICONS;
}

const SIZES = {
  /** Dense contexts — dropdown rows, list items. */
  sm: { box: 'size-9 rounded-lg', icon: 'size-4.5' },
  /** The category grid in the design. */
  lg: { box: 'size-14 rounded-2xl', icon: 'size-6' },
} as const;

/** The rounded blue square that fronts each category in the design. */
export function IconTile({
  iconKey,
  size = 'sm',
  className,
}: {
  iconKey: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = isIconKey(iconKey) ? ICONS[iconKey] : Building2;
  const dimensions = SIZES[size];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-brand-600 text-white',
        dimensions.box,
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={dimensions.icon} strokeWidth={2} />
    </span>
  );
}
