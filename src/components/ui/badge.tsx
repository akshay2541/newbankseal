import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Small status and metadata labels: "Liquidation", "10% Drop", auction state. */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-ink-100 text-ink-600',
        brand: 'bg-brand-50 text-brand-700',
        price: 'bg-price-soft text-price',
        success: 'bg-success-soft text-success-500',
        warning: 'bg-warning-soft text-warning-500',
        danger: 'bg-danger-soft text-danger-500',
        inverse: 'bg-ink-900/85 text-white backdrop-blur-sm',
      },
      size: {
        sm: 'px-2 py-0.5 text-2xs',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
