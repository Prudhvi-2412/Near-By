import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../lib/utils';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-white/10 bg-white/10 transition-colors data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-burgundy-600 data-[state=checked]:to-burgundy-700',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-cream-50 shadow transition-transform data-[state=checked]:translate-x-5" />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';
