import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SlotProps {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}

/**
 * Minimal `asChild` implementation: merges the slot's props onto its single child
 * element so `<Button asChild><Link/></Button>` renders one anchor with the button's
 * styling. Avoids pulling in all of Radix for one behaviour.
 */
export function Slot({ children, className, ...slotProps }: SlotProps) {
  if (!isValidElement(children)) {
    if (Children.count(children) > 1) {
      throw new Error('Slot expects exactly one React element child.');
    }
    return null;
  }

  const child = children as ReactElement<{ className?: string }>;

  return cloneElement(child, {
    ...slotProps,
    ...child.props,
    className: cn(className, child.props.className),
  });
}
