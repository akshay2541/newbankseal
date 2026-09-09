'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Themed select, built on Radix Select.
 *
 * Radix is used rather than a hand-rolled listbox because the accessible behaviour
 * here is genuinely hard to get right: typeahead, roving focus, Home/End, correct
 * `aria-activedescendant`, focus restoration on close, scroll locking, collision-aware
 * positioning and pointer-vs-keyboard distinctions. Radix ships all of that headless,
 * so everything below is styling against our own tokens — no vendor look leaks in.
 *
 * These are unopinionated primitives. See `category-select.tsx` for a composed usage
 * with groups, icons and counts.
 */

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

/**
 * Default trigger: matches the height and radius of `Input` so a select and a text
 * field sit on the same baseline in a form row.
 */
const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 w-full items-center justify-between gap-2 rounded-btn border border-border-strong bg-surface px-3.5 text-sm text-ink-900',
      'transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
      'data-[placeholder]:text-ink-400',
      'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
      'aria-[invalid=true]:border-danger-500',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-ink-400 transition-transform duration-200 data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const ScrollButton = ({ direction }: { direction: 'up' | 'down' }) => {
  const Component = direction === 'up' ? SelectPrimitive.ScrollUpButton : SelectPrimitive.ScrollDownButton;
  const Icon = direction === 'up' ? ChevronUp : ChevronDown;

  return (
    <Component className="flex cursor-default items-center justify-center bg-surface py-1 text-ink-400">
      <Icon className="size-4" />
    </Component>
  );
};

/**
 * Dropdown panel.
 *
 * `position="popper"` plus the translate rules keep the panel matched to the trigger's
 * width and flipped away from the viewport edge. Height is capped so a long category
 * list scrolls inside the panel rather than running off-screen.
 */
const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        'relative z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[10rem] overflow-hidden',
        'rounded-card border border-border-subtle bg-surface text-ink-900 shadow-float',
        'popover-panel',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 w-[max(var(--radix-select-trigger-width),14rem)]',
        className,
      )}
      {...props}
    >
      <ScrollButton direction="up" />
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      <ScrollButton direction="down" />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

/** Group heading — e.g. "Property", "Vehicles & assets". */
const SelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2.5 pt-2.5 pb-1.5 text-2xs font-semibold tracking-wide text-ink-400 uppercase', className)}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

/**
 * Option row.
 *
 * The check indicator sits in a fixed-width slot so labels stay aligned whether or not
 * a row is selected — a shifting baseline on selection reads as a layout bug.
 */
const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer items-center gap-2.5 rounded-btn py-2 pr-2.5 pl-2.5 text-sm outline-none select-none',
      'transition-colors',
      // Radix sets data-highlighted for both keyboard and pointer focus, so one rule
      // covers hover and arrow-key navigation identically.
      'data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700',
      'data-[state=checked]:font-medium data-[state=checked]:text-brand-700',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      className,
    )}
    {...props}
  >
    {children}
    <span className="ml-auto flex size-4 shrink-0 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-brand-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectItemText = SelectPrimitive.ItemText;

const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('-mx-1.5 my-1.5 h-px bg-border-subtle', className)} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
