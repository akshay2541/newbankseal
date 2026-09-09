'use client';

import { LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { IconTile } from '@/components/ui/icon-tile';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AssetType, CategoryFacet } from '@/domain/listing';
import { formatCompact } from '@/lib/format';

/**
 * Category dropdown for the hero search.
 *
 * Radix Select cannot hold an empty-string option value, so "All Category" uses the
 * `ALL` sentinel and a hidden input translates it back for submission — the form
 * posts no `category` param at all when nothing is narrowed, keeping the resulting
 * /explore URL clean and shareable.
 *
 * The trigger is styled to sit inside the hero's grey tray rather than using the
 * default bordered treatment, so it reads as one control with the search field.
 */

const ALL = '__all__';

/** Which heading each asset type falls under. Order defines the group order. */
const GROUPS: ReadonlyArray<{ label: string; types: ReadonlyArray<AssetType> }> = [
  { label: 'Property', types: ['residential', 'commercial', 'industrial', 'land'] },
  { label: 'Vehicles & assets', types: ['vehicle', 'machinery', 'gold'] },
];

export function CategorySelect({ categories }: { categories: CategoryFacet[] }) {
  const [value, setValue] = useState(ALL);

  const grouped = GROUPS.map((group) => ({
    label: group.label,
    items: categories.filter((category) => group.types.includes(category.assetType)),
  })).filter((group) => group.items.length > 0);

  // Anything whose asset type isn't mapped above still has to be reachable, otherwise
  // adding a new type to the database would silently hide it from search.
  const groupedSlugs = new Set(grouped.flatMap((group) => group.items.map((item) => item.slug)));
  const ungrouped = categories.filter((category) => !groupedSlugs.has(category.slug));

  return (
    <>
      {value !== ALL ? <input type="hidden" name="category" value={value} /> : null}

      <Select value={value} onValueChange={setValue}>
        <SelectTrigger
          aria-label="Filter by category"
          className="h-12 w-full justify-between gap-2 rounded-xl border-0 bg-transparent px-4 text-base font-medium text-brand-600 shadow-none focus:border-0 sm:w-52"
        >
          <SelectValue placeholder="All Category" />
        </SelectTrigger>

        <SelectContent className="w-[min(20rem,calc(100vw-2rem))]">
          <SelectItem value={ALL}>
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
              <LayoutGrid className="size-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <SelectItemText>All Category</SelectItemText>
              <span className="block text-2xs text-ink-400">Search every auction type</span>
            </span>
          </SelectItem>

          {/* Separator sits outside any group: a divider inside role="group" would be
              announced as part of that group's contents. */}
          {grouped.length > 0 ? <SelectSeparator /> : null}

          {grouped.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>

              {group.items.map((category) => (
                <CategoryOption key={category.slug} category={category} />
              ))}
            </SelectGroup>
          ))}

          {ungrouped.length > 0 ? (
            <SelectGroup>
              <SelectLabel>More</SelectLabel>
              {ungrouped.map((category) => (
                <CategoryOption key={category.slug} category={category} />
              ))}
            </SelectGroup>
          ) : null}
        </SelectContent>
      </Select>
    </>
  );
}

function CategoryOption({ category }: { category: CategoryFacet }) {
  return (
    <SelectItem value={category.slug}>
      <IconTile iconKey={category.iconKey} />
      <span className="min-w-0 flex-1 text-left">
        <SelectItemText>{category.name}</SelectItemText>
        <span className="block text-2xs text-ink-400">{formatCompact(category.listingCount)} listings</span>
      </span>
    </SelectItem>
  );
}
