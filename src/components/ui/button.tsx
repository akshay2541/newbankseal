import { Slot } from '@/components/ui/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * The single button primitive. Variants map 1:1 to the treatments in the design:
 * solid brand (Sign up / Explore), soft brand chip (active filter pill), outline
 * (Sign in), dark solid (View Auction), and ghost (nav links).
 *
 * Sizes carry their own responsive height through the `control` spacing tokens: 44px
 * where the button is tapped, easing down to the design's 40px (36px for `sm`) where
 * it is clicked. Every call site used to restate this by hand and no two agreed —
 * `h-11 sm:h-10`, `h-11 sm:h-9`, `h-11 sm:h-8`, `h-12`, `h-13` — which is how a phone
 * ended up with three different secondary-button heights on one screen.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    // Icons inside buttons should never intercept the pointer or shrink.
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
        soft: 'bg-brand-50 text-brand-600 hover:bg-brand-100',
        outline: 'border border-border-strong bg-surface text-ink-800 hover:bg-ink-50 hover:border-ink-300',
        dark: 'bg-control text-white hover:bg-control-hover',
        ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        link: 'text-brand-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-control-sm rounded-btn px-4 text-meta [&_svg]:size-3.5',
        md: 'h-control rounded-btn px-5 text-body [&_svg]:size-4',
        lg: 'h-control-lg rounded-btn px-6 text-body [&_svg]:size-4',
        icon: 'size-control-sm rounded-full [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the single child element instead of a <button> — e.g. to wrap a <Link>. */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      // Buttons inside a form default to submit; an unlabelled action button that
      // accidentally submits is a classic source of double-posts.
      {...(asChild ? {} : { type: type ?? 'button' })}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
