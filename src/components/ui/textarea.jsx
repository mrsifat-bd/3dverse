import * as React from 'react'
import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
