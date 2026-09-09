import { AlertCircle } from 'lucide-react';

/**
 * Form-level error banner.
 *
 * `role="alert"` means the message is announced when it appears, so a failure isn't
 * silent for screen-reader users. Content is always a message the server authored —
 * raw errors never reach here.
 */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-btn border border-danger-500/25 bg-danger-soft px-3.5 py-3"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-500" aria-hidden="true" />
      <p className="text-sm text-ink-800">{message}</p>
    </div>
  );
}
