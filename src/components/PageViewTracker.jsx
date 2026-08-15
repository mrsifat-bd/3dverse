'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordPageView } from '@/lib/analytics'

// Logs an anonymous page view on each route change (skips the admin area).
export default function PageViewTracker() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname && !pathname.startsWith('/admin')) recordPageView(pathname)
  }, [pathname])
  return null
}
