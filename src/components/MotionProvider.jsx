'use client'
import { LazyMotion, MotionConfig } from 'motion/react'
import { DURATION, EASE } from '@/lib/motion'

const loadFeatures = () => import('./motion/features').then((r) => r.default)

// App-wide Motion for React setup.
// - LazyMotion + `m` components: ~5 kB up front; the animation features load
//   right after hydration (`strict` makes any accidental full `motion.*`
//   component an error, so the bundle can't silently grow again).
// - reducedMotion="user": with the OS "Reduce motion" setting, transforms are
//   skipped and only opacity fades remain.
// - A shared default transition so every component feels the same.
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: DURATION.base, ease: EASE.out }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
