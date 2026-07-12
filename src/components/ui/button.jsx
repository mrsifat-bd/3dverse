import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-clay text-paper hover:bg-clay-dark',
        ghost: 'border border-line text-ink hover:bg-line/60',
        outline: 'border border-line bg-paper text-ink hover:bg-line/50',
        destructive: 'bg-destructive text-paper hover:bg-destructive/90',
        link: 'text-clay underline-offset-4 hover:underline',
        subtle: 'bg-line/50 text-ink hover:bg-line',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild, ...props },
  ref
) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
})

export { Button, buttonVariants }
