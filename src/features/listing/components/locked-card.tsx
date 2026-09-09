import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { GatedField } from '@/domain/listing';

/**
 * A detail block whose value is gated behind entitlement.
 *
 * When locked, the component renders fixed filler text — it has no access to the real
 * value, because the server never sent one. The blur is a visual cue, not the control:
 * inspecting the DOM or the network response for a locked card yields nothing.
 */
export function LockedCard({
  title,
  field,
  emptyText = 'Not provided by the bank.',
  action,
}: {
  title: string;
  field: GatedField;
  emptyText?: string;
  action?: React.ReactNode;
}) {
  const unlocked = !field.locked;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>

          {unlocked ? (
            <p className="mt-1.5 text-sm text-ink-700">{field.value ?? emptyText}</p>
          ) : (
            <p
              aria-hidden="true"
              className="mt-1.5 text-sm text-ink-400 blur-[5px] select-none"
            >
              Available to premium members only
            </p>
          )}
        </div>

        {field.locked ? (
          action ?? (
            <Link
              href="/pricing"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-btn border border-border-strong bg-surface px-4 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              Unlock
              <Lock className="size-3.5" aria-hidden="true" />
            </Link>
          )
        ) : null}
      </div>

      {/* Announced instead of the blurred filler, which is meaningless to a screen reader. */}
      {field.locked ? <p className="sr-only">{title} is available to premium members.</p> : null}
    </Card>
  );
}
