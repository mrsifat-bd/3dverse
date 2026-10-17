'use client'
import { useEffect, useState } from 'react'

// Subtle route transition. A template re-mounts on every navigation, so the
// new page fades/slides in over 220 ms (CSS, compositor-only). It is skipped
// on the very first page load so it never delays the first paint or LCP.
let hasNavigated = false

export default function Template({ children }) {
  const [animate] = useState(() => hasNavigated)
  useEffect(() => {
    hasNavigated = true
  }, [])
  return <div className={animate ? 'page-enter' : undefined}>{children}</div>
}
