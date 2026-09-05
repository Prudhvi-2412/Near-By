import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-burgundy-600 to-burgundy-700 text-cream-50 shadow-[0_4px_20px_-4px_rgba(163,36,79,0.6)] hover:from-burgundy-500 hover:to-burgundy-600 hover:shadow-[0_6px_26px_-4px_rgba(163,36,79,0.75)]',
        gold: 'bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-950 shadow-[0_4px_20px_-4px_rgba(201,162,39,0.5)] hover:from-gold-400 hover:to-gold-300',
        outline:
          'border border-white/15 bg-white/[0.02] text-cream-100 hover:border-gold-400/50 hover:bg-white/[0.06]',
        ghost: 'text-cream-200 hover:bg-white/[0.06]',
        destructive: 'bg-red-900/80 text-cream-50 hover:bg-red-800',
        link: 'text-gold-400 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6',
        lg: 'h-14 px-9 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';
