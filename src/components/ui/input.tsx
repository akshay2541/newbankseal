import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const fieldBase = [
  'w-full rounded-btn border border-border-strong bg-surface text-sm text-ink-900',
  'placeholder:text-ink-400',
  'transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
  'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:ring-danger-500/20',
].join(' ');

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, 'h-11 px-3.5', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-28 px-3.5 py-2.5', className)} {...props} />;
}
