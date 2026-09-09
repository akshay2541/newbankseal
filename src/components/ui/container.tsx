import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ContainerProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/**
 * The page content column: a 1200px column centred in the 1440px canvas, with the
 * gutter shrinking on smaller viewports.
 *
 * Remaining props are forwarded to the rendered element. Sections rely on this to pass
 * `aria-labelledby` — swallowing unknown props would silently drop accessibility
 * attributes at the call site, which is exactly the kind of failure nobody notices.
 */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  const Component = (as ?? 'div') as ElementType;

  return (
    <Component className={cn('mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8', className)} {...rest}>
      {children}
    </Component>
  );
}
