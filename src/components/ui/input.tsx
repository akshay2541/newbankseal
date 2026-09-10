import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Form controls share one base so a text input, a select and a textarea line up.
 *
 * The height is the `control` token, which is 44px on a phone — a tapped field that is
 * shorter than that is the single most common reason a mobile form feels fiddly — and
 * eases to the design's 40px on a desktop. The 16px font size is not a style choice:
 * iOS Safari zooms the page when a focused input's text is smaller, and the zoom does
 * not come back on blur.
 */
const fieldBase = [
  'w-full rounded-btn border border-border-strong bg-surface text-base text-ink-900 sm:text-body',
  'placeholder:text-ink-400',
  'transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
  'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:ring-danger-500/20',
].join(' ');

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, 'h-control px-3.5', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-28 px-3.5 py-2.5', className)} {...props} />;
}
