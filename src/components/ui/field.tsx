import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Label + control + error, wired together for screen readers.
 *
 * The error id is always attached via `aria-describedby` and the control is marked
 * `aria-invalid`, so validation failures are announced rather than only shown in red.
 */
export function Field({
  label,
  hint,
  error,
  required,
  action,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Optional control on the label row — a "Forgot password?" link, for instance. */
  action?: ReactNode;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-meta font-medium text-ink-800 sm:text-sm">
          {label}
          {required ? (
            <span className="ml-0.5 text-danger-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {action}
      </div>

      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}

      {hint && !error ? (
        <p id={hintId} className="text-xs leading-normal text-ink-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs leading-normal font-medium text-danger-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
