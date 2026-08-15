import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
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

// When asChild is true, merge the button classes onto the single child element
// (e.g. a Next.js <Link>) instead of rendering a wrapping <button>. This keeps
// the flex + gap + centering classes on the real anchor so icons stay inline
// with their labels rather than stacking above them.
const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, children, ...props },
  ref
) {
  const classes = cn(buttonVariants({ variant, size, className }))

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(classes, children.props.className),
      ref,
      ...props,
    })
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})

export { Button, buttonVariants }
