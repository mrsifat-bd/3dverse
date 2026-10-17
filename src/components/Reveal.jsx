'use client'
import { useEffect, useRef } from 'react'

// Scroll reveal for lists and sections — CSS transition, one shared
// IntersectionObserver, no animation library.
//
// - Server-rendered content is visible by default: nothing is hidden before
//   JavaScript runs, so it never delays the first paint or LCP.
// - Visibility is decided from the observer's own first report (it includes the
//   element's position), so mounting 100+ cards causes no forced layouts.
// - Things already on screen stay put; only things below the fold are hidden
//   and then slide in as they scroll into view.
// - `revealKey`: once an item has been revealed it is remembered for the rest
//   of the visit, so going back to a page doesn't replay the entrance.
// - prefers-reduced-motion: nothing is hidden or animated.

const seen = new Set()
const callbacks = new WeakMap()
let observer = null

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) callbacks.get(e.target)?.(e)
    },
    // The huge top margin means "intersecting" = "its top has reached the
    // bottom ~6% line, or it is anywhere above it". So an item the user flung
    // past between two frames (never actually on screen) still gets revealed
    // instead of staying hidden above the viewport.
    { rootMargin: '100000px 0px -6% 0px', threshold: 0 },
  )
  return observer
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function Reveal({ children, className = '', delayIndex = 0, revealKey, as: Tag = 'div' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const io = getObserver()
    if (!el || !io || reduced()) return
    if (revealKey != null && seen.has(revealKey)) return

    let first = true
    callbacks.set(el, (entry) => {
      if (first) {
        first = false
        // On screen (or above it) at mount: leave it alone.
        if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
          if (revealKey != null) seen.add(revealKey)
          io.unobserve(el)
          callbacks.delete(el)
          return
        }
        el.style.setProperty('--reveal-delay', `${(delayIndex % 4) * 60}ms`)
        el.classList.add('reveal-pending')
        return
      }
      if (entry.isIntersecting) {
        el.classList.add('reveal-in')
        if (revealKey != null) seen.add(revealKey)
        io.unobserve(el)
        callbacks.delete(el)
      }
    })
    io.observe(el)
    return () => {
      io.unobserve(el)
      callbacks.delete(el)
    }
  }, [delayIndex, revealKey])

  return <Tag ref={ref} className={className}>{children}</Tag>
}
