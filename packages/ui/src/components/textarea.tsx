import * as React from 'react';
import { cn } from '../lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-cream-100 placeholder:text-cream-400/40 outline-none transition-colors',
        'focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
