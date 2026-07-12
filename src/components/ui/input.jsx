import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-line bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
