import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium tracking-wide',
  {
    variants: {
      variant: {
        gold: 'bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-500/30',
        burgundy: 'bg-burgundy-600/20 text-burgundy-300 ring-1 ring-inset ring-burgundy-500/30',
        success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
        neutral: 'bg-white/[0.06] text-cream-200 ring-1 ring-inset ring-white/10',
        danger: 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
