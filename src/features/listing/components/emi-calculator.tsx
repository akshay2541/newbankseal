'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatInr } from '@/lib/format';

/**
 * Indicative EMI calculator.
 *
 * Runs entirely in the browser — no figure the visitor types here is sent anywhere,
 * which matters because loan amount and tenure are financial details we have no reason
 * to collect. It is explicitly indicative: the real instalment depends on the lender's
 * rate, processing fees, loan-to-value and the buyer's credit profile, and the card
 * says so rather than implying a quote.
 */
export function EmiCalculator({ reservePriceInr, emdAmountInr }: { reservePriceInr: number; emdAmountInr: number }) {
  // Sensible starting point: the balance still owed after the deposit.
  const defaultLoan = Math.max(0, Math.round(reservePriceInr - emdAmountInr));

  const [loanAmount, setLoanAmount] = useState(defaultLoan);
  const [ratePercent, setRatePercent] = useState(8.5);
  const [years, setYears] = useState(20);

  const monthly = useMemo(() => calculateEmi(loanAmount, ratePercent, years), [loanAmount, ratePercent, years]);

  return (
    <Card className="p-card">
      <h2 className="text-h5 font-semibold text-ink-900">EMI Calculator</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="emi-loan" className="block text-xs font-medium text-ink-600">
            Loan amount
          </label>
          <input
            id="emi-loan"
            type="number"
            min={0}
            // Bounded so a pasted value cannot push the maths into Infinity.
            max={1_000_000_000}
            step={10_000}
            value={loanAmount}
            onChange={(event) => setLoanAmount(clamp(Number(event.target.value), 0, 1_000_000_000))}
            className="mt-1.5 h-control w-full rounded-btn border border-border-strong bg-surface px-3.5 text-sm tabular-nums text-ink-900 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
          />
          <p className="mt-1 text-2xs text-ink-400">
            Default = reserve ({formatInr(reservePriceInr)}) − EMD ({formatInr(emdAmountInr)})
          </p>
        </div>

        <Slider
          id="emi-rate"
          label="Interest rate"
          readout={`${ratePercent.toFixed(2)}% p.a.`}
          min={5}
          max={18}
          step={0.05}
          value={ratePercent}
          onChange={setRatePercent}
        />

        <Slider
          id="emi-tenure"
          label="Tenure"
          readout={`${years} Years`}
          min={1}
          max={30}
          step={1}
          value={years}
          onChange={setYears}
        />

        <div className="rounded-btn border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-xs text-ink-600">Monthly EMI</p>
          {/* Announced on change so the figure is not silent for screen-reader users. */}
          <p aria-live="polite" className="mt-0.5 text-xl font-bold tabular-nums text-brand-700">
            {monthly === null ? '—' : formatInr(monthly)}
          </p>
        </div>

        <p className="text-2xs leading-relaxed text-ink-400">
          Indicative only. Your actual EMI depends on the lender&apos;s rate, processing fees, loan-to-value and credit
          profile.
        </p>
      </div>
    </Card>
  );
}

function Slider({
  id,
  label,
  readout,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  readout: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-ink-600">
          {label}
        </label>
        <span className="text-xs font-semibold tabular-nums text-ink-900">{readout}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
      />
    </div>
  );
}

/**
 * Standard amortising EMI: P·r·(1+r)^n / ((1+r)^n − 1).
 *
 * A zero rate would divide by zero, so that case falls back to straight-line
 * repayment rather than returning NaN into the UI.
 */
function calculateEmi(principal: number, annualRatePercent: number, years: number): number | null {
  if (principal <= 0 || years <= 0) return null;

  const months = years * 12;
  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) return Math.round(principal / months);

  const growth = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * growth) / (growth - 1);

  return Number.isFinite(emi) ? Math.round(emi) : null;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
