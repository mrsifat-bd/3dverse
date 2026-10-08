'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const WORDS = ['Dream', 'Design', 'Deliver']

// Same look as before (glowing orbs, floating logo, rotating word), rebuilt to
// be cheap to render:
// - The orbs are radial gradients instead of `blur-3xl` filters (a 64px blur
//   on large layers is one of the most expensive things to repaint).
// - The infinite orb/logo motion is CSS keyframes on transform/opacity, which
//   the browser runs on the compositor instead of the JS main thread.
// - Everything pauses while the hero is off screen or the tab is hidden, and
//   honours prefers-reduced-motion (see globals.css).
export default function HeroPanel() {
  const [i, setI] = useState(0)
  const [active, setActive] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    let onScreen = true
    const update = () => setActive(onScreen && document.visibilityState === 'visible')
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update() })
      : null
    if (el && io) io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 1900)
    return () => clearInterval(t)
  }, [active])

  return (
    <div
      ref={ref}
      data-paused={active ? undefined : ''}
      className="hero-anim relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-paper to-cream"
    >
      {/* Soft glowing orbs (gradient glow, no blur filter) */}
      <div aria-hidden className="hero-orb hero-orb-a pointer-events-none absolute -right-[104px] -top-[104px] h-72 w-72 rounded-full" />
      <div aria-hidden className="hero-orb hero-orb-b pointer-events-none absolute -bottom-[112px] -left-[96px] h-80 w-80 rounded-full" />

      <div className="relative flex h-full flex-col items-center justify-center gap-6 p-8">
        {/* Floating, gently tilting logo */}
        <div className="hero-float drop-shadow-xl">
          <Image src="/logo.png" alt="3D Verse" width={170} height={188} priority className="h-28 w-auto dark:invert sm:h-32" />
        </div>

        {/* Rotating word */}
        <div className="flex h-14 items-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={WORDS[i]}
              initial={{ y: 26, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -26, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl font-bold tracking-tight text-clay sm:text-5xl"
            >
              {WORDS[i]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {WORDS.map((w, idx) => (
            <span
              key={w}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? 'w-7 bg-clay' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
