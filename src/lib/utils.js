import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn/ui className helper.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
