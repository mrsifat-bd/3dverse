'use client'
import { useEffect, useRef } from 'react'

// Lightweight scroll-reveal for long lists (product grids).
//
// Why not Framer Motion here: the grid previously staggered ALL cards from one
// trigger (0.05s × index), so the 100th card only appeared ~5s after the grid
// came into view, and every card ran its own JS-driven animation. This uses
// ONE shared IntersectionObserver and a CSS opacity/transform transition, which
// the browser runs on the compositor.
//
// - Server-rendered cards are visible by default (no LCP delay, no flash).
// - Cards already on screen at mount stay as they are; only off-screen cards
//   are hidden and then revealed as they scroll in.
// - prefers-reduced-motion: nothing is hidden or animated.

let observer = null
const callbacks = new WeakMap()

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const cb = callbacks.get(e.target)
        if (cb) cb()
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
  )
  return observer
}

export default function Reveal({ children, className = '', delayIndex = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const io = getObserver()
    if (!el || !io) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) return // already visible: leave it
    el.classList.add('reveal-pending')
    el.style.setProperty('--reveal-delay', `${(delayIndex % 4) * 60}ms`)
    callbacks.set(el, () => {
      el.classList.add('reveal-in')
      io.unobserve(el)
      callbacks.delete(el)
    })
    io.observe(el)
    return () => { io.unobserve(el); callbacks.delete(el) }
  }, [delayIndex])

  return <div ref={ref} className={className}>{children}</div>
}
