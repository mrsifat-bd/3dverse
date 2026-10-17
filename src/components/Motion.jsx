import Reveal from './Reveal'

// Entrance helpers used by server pages. No animation library and no
// JavaScript needed for the first paint:
//
// <FadeIn onLoad> — above-the-fold content (hero). A short CSS entrance that
//   starts with the first paint, so it never waits for hydration (the old
//   version kept the hero invisible until JS loaded, delaying LCP by ~0.7 s).
// <FadeIn> — below-the-fold sections: revealed when scrolled into view.
// <Stagger>/<StaggerItem index> — grids: each item reveals with a small,
//   capped stagger.
// All of it is disabled for "reduce motion" users (globals.css / Reveal).

export function FadeIn({ children, delay = 0, className = '', onLoad = false }) {
  if (onLoad) {
    return (
      <div className={`enter ${className}`} style={delay ? { '--enter-delay': `${delay}s` } : undefined}>
        {children}
      </div>
    )
  }
  return <Reveal className={className}>{children}</Reveal>
}

export function Stagger({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({ children, className = '', index = 0 }) {
  return <Reveal className={className} delayIndex={index}>{children}</Reveal>
}
