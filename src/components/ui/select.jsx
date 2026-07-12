import * as React from 'react'
import { cn } from '@/lib/utils'

// Lightweight native select styled to match the design system.
export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-11 rounded-full border border-line bg-paper px-4 pr-9 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
