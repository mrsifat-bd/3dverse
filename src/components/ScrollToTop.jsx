'use client'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// Floating "back to top" button — appears after scrolling, smooth-scrolls up.
export default function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'glass fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full text-ink shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-clay hover:bg-clay hover:text-paper active:scale-90',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
