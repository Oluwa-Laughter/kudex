import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:opacity-90',
      secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
      outline: 'border border-border bg-transparent text-foreground hover:bg-secondary',
      ghost: 'text-foreground hover:bg-secondary',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
    };
    const sizes = {
      default: 'min-h-11 px-5 py-3 text-sm font-semibold',
      sm: 'min-h-11 px-3 text-sm',
      lg: 'min-h-12 px-6 py-3 text-base font-semibold',
      icon: 'h-11 w-11 shrink-0 p-0',
    };

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl transition-[background-color,opacity,transform] duration-150 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
