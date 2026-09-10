import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * The white panel used for every boxed section in the design: a 1px subtle border,
 * a 16px radius and a barely-there shadow. Structure comes from the border, not
 * from elevation.
 *
 * The sub-components carry the padding so a card's inner rhythm is decided once. They
 * were previously optional, and cards that skipped them picked `p-4`, `p-5` or `p-6`
 * by eye — three different insets for the same kind of panel, none of them tighter on
 * a phone.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-border-subtle bg-surface shadow-card', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between gap-3 px-card pt-card pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-h5 font-semibold text-ink-900', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-card pb-card', className)} {...props} />;
}
