import * as React from 'react'
import { cn } from '@/lib/utils'

export const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn('rounded-2xl border border-line bg-paper', className)} {...props} />
})

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-lg font-semibold text-ink', className)} {...props} />
}
export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-stone', className)} {...props} />
}
export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}
export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
