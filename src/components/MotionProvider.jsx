'use client'
import { MotionConfig } from 'framer-motion'

// App-wide motion settings. `reducedMotion="user"` makes every Framer Motion
// animation honour the OS "Reduce motion" accessibility setting — transforms
// and layout shifts are skipped for those users while opacity still fades.
// Users without the preference see all animations exactly as before.
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
