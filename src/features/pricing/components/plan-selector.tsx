'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatInr } from '@/lib/format';
import { DEFAULT_PLAN_ID, PLAN_FEATURES, PLANS, discountPercent, type Plan } from '../plans';

/**
 * Plan chooser.
 *
 * A real radio group — native inputs inside a `<fieldset>` — rather than divs with
 * click handlers. That gets arrow-key navigation, a single tab stop, correct
 * announcement of "2 of 3 selected", and form semantics for free; the visual radio is
 * drawn from the input's checked state.
 *
 * The design shows two rows ticked at once, which a radio group cannot express and a
 * customer would misread as two active subscriptions. Exactly one is selected here.
 */
export function PlanSelector() {
  const [selectedId, setSelectedId] = useState(DEFAULT_PLAN_ID);
  const groupName = useId();

  const selected = PLANS.find((plan) => plan.id === selectedId) ?? PLANS[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0">
        <div className="rounded-card border border-border-subtle bg-surface p-6">
          <h2 className="sr-only">What every plan includes</h2>

          <ul className="space-y-4">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-[0.9375rem] text-ink-800">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          Carries the chosen plan through to sign-up so the selection is not silently
          lost at the next step. It is a hint, not an entitlement — the server re-reads
          the plan when checkout exists.
        */}
        <Link
          href={`/sign-up?plan=${encodeURIComponent(selectedId)}`}
          className="mt-4 flex h-14 w-full items-center justify-center rounded-btn bg-brand-600 text-base font-medium text-white transition-colors hover:bg-brand-700"
        >
          Get Started
        </Link>
      </div>

      <fieldset className="min-w-0 space-y-4">
        <legend className="sr-only">Choose a billing period</legend>

        {PLANS.map((plan) => (
          <PlanRow
            key={plan.id}
            plan={plan}
            groupName={groupName}
            checked={plan.id === selected?.id}
            onSelect={() => setSelectedId(plan.id)}
          />
        ))}
      </fieldset>
    </div>
  );
}

function PlanRow({
  plan,
  groupName,
  checked,
  onSelect,
}: {
  plan: Plan;
  groupName: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const percent = discountPercent(plan);

  return (
    <label
      className={cn(
        'flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-4 rounded-card border-2 bg-surface p-5 transition-colors sm:flex-nowrap sm:p-6',
        checked ? 'border-brand-600' : 'border-transparent hover:border-border-strong',
        // The ring follows the input's focus, so keyboard users see the same affordance.
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600',
      )}
    >
      <input
        type="radio"
        name={groupName}
        value={plan.id}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />

      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-border-strong bg-surface',
        )}
      >
        {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xl font-bold text-ink-900">{plan.name}</span>
        {percent > 0 ? (
          <span className="mt-2 inline-flex items-center rounded-md bg-brand-50 px-2.5 py-1 text-[0.8125rem] font-medium text-brand-600">
            {percent}% Savings
          </span>
        ) : null}
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-sm text-ink-500">Total</span>
        <span className="mt-1 block text-lg font-bold text-ink-900 line-through">
          {formatInr(plan.listPriceInr)}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-sm text-ink-500">Discount price</span>
        <span className="mt-1 block text-xl font-bold text-ink-900">
          {formatInr(plan.priceInr)}{' '}
          <span className="text-sm font-normal text-ink-500">({percent}%)</span>
        </span>
      </span>
    </label>
  );
}
