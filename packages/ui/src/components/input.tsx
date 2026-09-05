import * as React from 'react';
import { cn } from '../lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-cream-100 placeholder:text-cream-400/40 outline-none transition-colors',
        'focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
