import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/[0.03] data-[state=checked]:border-gold-400 data-[state=checked]:bg-gold-400/90',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>
      <Check className="h-3.5 w-3.5 text-charcoal-950" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
