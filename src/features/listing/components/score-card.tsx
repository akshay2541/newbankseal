import { Card } from '@/components/ui/card';
import type { ListingScore } from '@/server/services/listing-detail-service';
import { cn } from '@/lib/cn';

const TONE_DOT = {
  positive: 'bg-success-500',
  caution: 'bg-warning-500',
  negative: 'bg-danger-500',
} as const;

/**
 * Listing risk summary.
 *
 * Every reading is computed from a fact on the record — the revised reserve, the
 * auction date, media on file, local inventory, possession type. The wording describes
 * what was observed rather than recommending an action: a buyer acting on a wrong
 * signal here is out real money, so the card states its basis and stops short of advice.
 */
export function ScoreCard({ score }: { score: ListingScore }) {
  return (
    <Card className="p-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h5 font-semibold text-ink-900">Listing Score</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          {score.value}
          <span className="font-medium text-brand-500">/100</span>
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {score.signals.map((signal) => (
          <li key={signal.text} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', TONE_DOT[signal.tone])}
            />
            <span className="text-xs leading-relaxed text-ink-700">{signal.text}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-border-subtle pt-3 text-2xs leading-relaxed text-ink-400">
        A heuristic summary of discount, auction timing, paperwork completeness, local demand and possession status.
        It is not valuation or legal advice — verify the auction notice and title before bidding.
      </p>
    </Card>
  );
}
