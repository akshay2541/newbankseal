'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import type { ExploreQuery } from '@/lib/validation/auth';
import { buildExploreHref } from '../lib/href';

/**
 * The browse page's dropdowns, on the shared Radix `Select` so they match every other
 * menu in the product and keep its keyboard and screen-reader behaviour.
 */

const SORTS: ReadonlyArray<{ value: NonNullable<ExploreQuery['sort']>; label: string }> = [
  { value: 'newest', label: 'Default' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

/**
 * Sort control. Changing it navigates immediately — no separate apply step, which is
 * what the design shows and what people expect of a sort menu.
 */
export function SortSelect({ query }: { query: ExploreQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={query.sort ?? 'newest'}
      onValueChange={(value) => {
        // Sorting resets to page 1: staying on page 7 of a reordered list is meaningless.
        startTransition(() => router.push(buildExploreHref(query, { sort: value as ExploreQuery['sort'], page: 1 })));
      }}
    >
      <SelectTrigger
        aria-label="Sort results"
        data-pending={pending || undefined}
        className="h-11 w-auto gap-3 rounded-lg border-border-subtle px-4 text-[0.8125rem] font-medium text-ink-800 data-[pending]:opacity-60 sm:h-10"
      >
        <span className="whitespace-nowrap">
          Sort by : <SelectValue />
        </span>
      </SelectTrigger>

      <SelectContent>
        {SORTS.map((sort) => (
          <SelectItem key={sort.value} value={sort.value}>
            <SelectItemText>{sort.label}</SelectItemText>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ALL = '__all__';

/**
 * A facet dropdown inside the search form.
 *
 * Radix cannot hold an empty-string value, so "all" uses a sentinel and a hidden input
 * carries the real value into the GET submit — the same pattern as the hero's category
 * picker, so an unfiltered choice submits no parameter at all.
 */
export function FacetSelect({
  name,
  label,
  placeholder,
  value,
  options,
  className,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string | undefined;
  options: ReadonlyArray<{ value: string; label: string }>;
  className?: string;
}) {
  const [selected, setSelected] = useState(value || ALL);

  return (
    <div className={cn('sm:w-48', className)}>
      {selected !== ALL ? <input type="hidden" name={name} value={selected} /> : null}

      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger
          aria-label={label}
          className="h-11 rounded-lg border-border-subtle text-sm text-ink-700"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>
            <SelectItemText>{placeholder}</SelectItemText>
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <SelectItemText>{option.label}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
