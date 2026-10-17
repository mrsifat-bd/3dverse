// Loaded lazily by <LazyMotion> after the page has rendered, so the animation
// engine (~15 kB) is not on the critical path. Includes animate/exit/variants,
// hover/tap/focus gestures and whileInView. (No layout or drag animations —
// those would need `domMax`.)
import { domAnimation } from 'motion/react'

export default domAnimation
